// listings.webflow.mapper.ts

import { IListing } from "../../modules/listings/listings.interface";
import { WebflowFieldData } from "./webflow.types";



const toWebflowSlug = (refCode: string, title: string) => {
  const titleSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${titleSlug}-${refCode.toLowerCase()}`;
};

export const mapListingToWebflowFieldData = (
  listing: IListing
): WebflowFieldData => {
  const fieldData: WebflowFieldData = {
    name: listing.title,
    slug: toWebflowSlug(listing.ref_code, listing.title),

    "backend-id": listing.id.toString(),
    "reference-code": listing.ref_code,
    status: listing.status,

    city: listing.location.city,
    region: listing.location.region,
    country: listing.location.country,

    price: listing.price.amount,
    "price-currency": listing.price.currency,

    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,

    views: listing.listings_view,
    "is-deleted": listing.is_deleted,
    "associate-id": listing.associate_id.toString(),

    gallery: (listing.images || []).map((url) => ({ url })),
    "sold-at": listing.sold_at ? listing.sold_at.toISOString() : null,
  };

  if (listing.area_sqm?.value !== undefined) {
    fieldData.area = listing.area_sqm.value;
  }
  if (listing.area_sqm?.unit !== undefined) {
    fieldData["area-unit"] = listing.area_sqm.unit;
  }
  if (listing.referral_commission?.offered_amount !== undefined) {
    fieldData["referral-commission"] = listing.referral_commission.offered_amount;
  }
  if (listing.cover_image) {
    fieldData["cover-image"] = { url: listing.cover_image };
  }
  if (listing.created_at) {
    fieldData["created-at"] = listing.created_at.toISOString();
  }
  if (listing.updated_at) {
    fieldData["updated-at"] = listing.updated_at.toISOString();
  }

  return fieldData;
};