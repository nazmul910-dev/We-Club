export type ListingStatus =
  | "active"
  | "pending"
  | "sold"
  | "draft"
  | "cancelled"
  | "rejected";

export interface WebflowImage {
  url: string;
  alt?: string;
}

export interface WebflowFieldData {
  name: string;
  slug?: string;

  "property-name"?: string;
  "backend-id"?: string;
  "reference-code"?: string;
  status?: string;

  city?: string;
  region?: string;
  country?: string;

  price?: number;
  "price-currency"?: string;

  bedrooms?: number;
  bathrooms?: number;

  area?: number;
  "area-unit"?: string;

  "referral-commission"?: number;

  "cover-image"?: {
    url: string;
    alt?: string;
  };

  gallery?: Array<{
    url: string;
    alt?: string;
  }>;

  views?: number;

  "is-deleted"?: boolean;

  "associate-id"?: string;

  "created-at"?: string;
  "updated-at"?: string;
  "sold-at"?: string | null;
}

export interface WebflowCreateItemPayload {
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: WebflowFieldData;
}

export interface WebflowUpdateItemPayload {
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData?: Partial<WebflowFieldData>;
}

export interface WebflowItemResponse {
  id: string;
  cmsLocaleId?: string;

  lastPublished?: string | null;
  lastUpdated?: string;
  createdOn?: string;

  isArchived?: boolean;
  isDraft?: boolean;

  fieldData: WebflowFieldData;
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
}

export interface WebflowCollectionsResponse {
  collections: WebflowCollection[];
}

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  workspaceId?: string;
}

export interface WebflowSitesResponse {
  sites: WebflowSite[];
}

export interface WebflowPublishResponse {
  publishedItemIds?: string[];
  errors?: string[];
}