import { Types } from "mongoose";

export const RETREAT_LOCATION_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type RetreatLocationStatus = (typeof RETREAT_LOCATION_STATUSES)[number];

export interface IRetreatLocation {
  title: string;
  slug: string;
  country: string;
  city: string;

  tagline?: string | undefined;
  description: string;

  coverImage?: string | undefined;
  promoVideoUrl?: string | undefined;
  galleryImages: string[];
  whatsIncluded: string[];

  isFeatured: boolean;
  isActive: boolean;
  status: RetreatLocationStatus;
  order: number;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateRetreatLocation {
  title: string;
  slug?: string | undefined;
  country: string;
  city: string;

  tagline?: string | undefined;
  description: string;

  coverImage?: string | undefined;
  promoVideoUrl?: string | undefined;
  galleryImages?: string[] | undefined;
  whatsIncluded?: string[] | undefined;

  isFeatured?: boolean | undefined;
  isActive?: boolean | undefined;
  status?: RetreatLocationStatus | undefined;
  order?: number | undefined;
}

export interface IUpdateRetreatLocation {
  title?: string | undefined;
  slug?: string | undefined;
  country?: string | undefined;
  city?: string | undefined;

  tagline?: string | undefined;
  description?: string | undefined;

  coverImage?: string | null | undefined;
  promoVideoUrl?: string | null | undefined;
  galleryImages?: string[] | undefined;
  whatsIncluded?: string[] | undefined;

  isFeatured?: boolean | undefined;
  isActive?: boolean | undefined;
  status?: RetreatLocationStatus | undefined;
  order?: number | undefined;
}

export interface IRetreatLocationQuery {
  status?: RetreatLocationStatus | undefined;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}
