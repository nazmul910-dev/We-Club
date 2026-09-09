import {
  ListingStatus,
  WebflowCollection,
  WebflowCollectionsResponse,
  WebflowCreateItemPayload,
  WebflowFieldData,
  WebflowItemResponse,
  WebflowPublishResponse,
  WebflowSite,
  WebflowSitesResponse,
  WebflowUpdateItemPayload,
} from "./webflow.types";

import config from "../../config";

class WebflowService {
  private readonly baseUrl = "https://api.webflow.com/v2";

  private readonly token: string;
  private readonly siteId: string;
  private readonly propertiesCollectionId: string;


  private readonly PUBLIC_WEBFLOW_STATUSES: ListingStatus[] = [
    "active",
    "sold",
  ];

  constructor() {
    const token = config.WEBFLOW_API_TOKEN
    const siteId = config.WEBFLOW_SITE_ID
    const collectionId = config.WEBFLOW_PROPERTIES_COLLECTION_ID

    if (!token) {
      throw new Error(
        "WEBFLOW_API_TOKEN is missing"
      );
    }

    if (!siteId) {
      throw new Error(
        "WEBFLOW_SITE_ID is missing"
      );
    }

    if (!collectionId) {
      throw new Error(
        "WEBFLOW_PROPERTIES_COLLECTION_ID is missing"
      );
    }

    this.token = token;
    this.siteId = siteId;
    this.propertiesCollectionId = collectionId;
  }

  // =====================================================
  // GENERIC WEBFLOW REQUEST
  // =====================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}${endpoint}`,
      {
        ...options,

        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",

          ...(options.headers || {}),
        },
      }
    );

    const text = await response.text();

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      console.error("Webflow API Error:", {
        status: response.status,
        endpoint,
        data,
      });

      throw new Error(
        data?.message ||
          data?.msg ||
          `Webflow API request failed with status ${response.status}`
      );
    }

    return data as T;
  }

  // =====================================================
  // CHECK IF STATUS SHOULD BE PUBLIC
  // =====================================================

  shouldPublishStatus(
    status: ListingStatus
  ): boolean {
    return this.PUBLIC_WEBFLOW_STATUSES.includes(
      status
    );
  }

  // =====================================================
  // GET ALL SITES
  // =====================================================

  async getSites(): Promise<WebflowSite[]> {
    const response =
      await this.request<WebflowSitesResponse>(
        "/sites"
      );

    return response.sites;
  }

  // =====================================================
  // GET ALL COLLECTIONS
  // =====================================================

  async getCollections(): Promise<WebflowCollection[]> {
    const response =
      await this.request<WebflowCollectionsResponse>(
        `/sites/${this.siteId}/collections`
      );

    return response.collections;
  }

  // =====================================================
  // GET PROPERTIES COLLECTION
  // =====================================================

  async getPropertiesCollection() {
    return this.request(
      `/collections/${this.propertiesCollectionId}`
    );
  }

  // =====================================================
  // CREATE PROPERTY
  // =====================================================

  async createProperty(
    fieldData: WebflowFieldData,
    status: ListingStatus
  ): Promise<WebflowItemResponse> {
    const shouldPublish =
      this.shouldPublishStatus(status);

    /**
     * If active/sold:
     *
     * isDraft = false
     * Then publish the item immediately.
     *
     * If pending/draft/cancelled/rejected:
     *
     * isDraft = true
     * It will NOT be public.
     */

    const payload: WebflowCreateItemPayload = {
      isArchived: false,
      isDraft: !shouldPublish,
      fieldData,
    };

    const item =
      await this.request<WebflowItemResponse>(
        `/collections/${this.propertiesCollectionId}/items`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

    /**
     * Automatically publish active/sold listings.
     */
    if (shouldPublish && item.id) {
      await this.publishProperty(item.id);
    }

    return item;
  }

  // =====================================================
  // UPDATE PROPERTY
  // =====================================================

  async updateProperty(
    webflowItemId: string,
    fieldData: Partial<WebflowFieldData>,
    status: ListingStatus
  ): Promise<WebflowItemResponse> {
    const shouldPublish =
      this.shouldPublishStatus(status);

    /**
     * If status is active/sold:
     *
     * Update item
     * Then publish it.
     *
     * If status is pending/draft/cancelled/rejected:
     *
     * Update item as draft
     * Then unpublish it if it was already live.
     */

    if (shouldPublish) {
      const payload: WebflowUpdateItemPayload = {
        isDraft: false,
        isArchived: false,
        fieldData,
      };

      const item =
        await this.request<WebflowItemResponse>(
          `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

      await this.publishProperty(webflowItemId);

      return item;
    }

    /**
     * Non-public status.
     *
     * First update the CMS item.
     */
    const payload: WebflowUpdateItemPayload = {
      isDraft: true,
      isArchived: false,
      fieldData,
    };

    const item =
      await this.request<WebflowItemResponse>(
        `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

    /**
     * If this item was previously published,
     * remove it from the live website.
     */
    try {
      await this.unpublishProperty(
        webflowItemId
      );
    } catch (error) {
      /**
       * If it wasn't published before,
       * Webflow can return an error here.
       *
       * We don't want that to break the update.
       */
      console.log(
        "Webflow item was not live or already unpublished."
      );
    }

    return item;
  }

  // =====================================================
  // PUBLISH SINGLE PROPERTY
  // =====================================================

  async publishProperty(
    webflowItemId: string
  ): Promise<WebflowPublishResponse> {
    return this.request<WebflowPublishResponse>(
      `/collections/${this.propertiesCollectionId}/items/publish`,
      {
        method: "POST",

        body: JSON.stringify({
          itemIds: [webflowItemId],
        }),
      }
    );
  }

  // =====================================================
  // UNPUBLISH SINGLE PROPERTY
  // =====================================================

  async unpublishProperty(
    webflowItemId: string
  ): Promise<void> {
    await this.request(
      `/collections/${this.propertiesCollectionId}/items/${webflowItemId}/live`,
      {
        method: "DELETE",
      }
    );
  }

  // =====================================================
  // ARCHIVE PROPERTY
  // =====================================================

  async archiveProperty(
    webflowItemId: string
  ): Promise<WebflowItemResponse> {
    const payload: WebflowUpdateItemPayload = {
      isArchived: true,
    };

    return this.request<WebflowItemResponse>(
      `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  // =====================================================
  // UNARCHIVE PROPERTY
  // =====================================================

  async unarchiveProperty(
    webflowItemId: string
  ): Promise<WebflowItemResponse> {
    const payload: WebflowUpdateItemPayload = {
      isArchived: false,
    };

    return this.request<WebflowItemResponse>(
      `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  // =====================================================
  // GET SINGLE PROPERTY
  // =====================================================

  async getProperty(
    webflowItemId: string
  ): Promise<WebflowItemResponse> {
    return this.request<WebflowItemResponse>(
      `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`
    );
  }

  // =====================================================
  // DELETE PROPERTY
  // =====================================================

  async deleteProperty(
    webflowItemId: string
  ): Promise<void> {
    await this.request(
      `/collections/${this.propertiesCollectionId}/items/${webflowItemId}`,
      {
        method: "DELETE",
      }
    );
  }
}

export const webflowService =
  new WebflowService();