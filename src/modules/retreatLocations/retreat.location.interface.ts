import { Types } from "mongoose";

export const RETREAT_LOCATION_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type RetreatLocationStatus =
  (typeof RETREAT_LOCATION_STATUSES)[number];

export interface IVenueDetails {
  venueName?: string | undefined;
  capacity?: number | undefined;
  accommodationType?: string | undefined;
  features?: string[] | undefined;
}

export interface ILocationCoordinates {
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export interface IRetreatLocation {
  name: string;
  slug: string;

  country: string;
  city: string;
  stateOrProvince?: string | undefined;
  address?: string | undefined;

  coordinates?: ILocationCoordinates | undefined;

  description: string;
  shortDescription?: string | undefined;

  venueDetails?: IVenueDetails | undefined;
  amenities: string[];

  coverImage: string;
  gallery: string[];

  featured: boolean;
  status: RetreatLocationStatus;
  isActive: boolean;
  order: number;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateRetreatLocation {
  name: string;
  slug?: string | undefined;

  country: string;
  city: string;
  stateOrProvince?: string | undefined;
  address?: string | undefined;

  coordinates?: ILocationCoordinates | undefined;

  description: string;
  shortDescription?: string | undefined;

  venueDetails?: IVenueDetails | undefined;
  amenities?: string[] | undefined;

  coverImage: string;
  gallery?: string[] | undefined;

  featured?: boolean | undefined;
  isActive?: boolean | undefined;
  order?: number | undefined;
}

export interface IUpdateRetreatLocation {
  name?: string | undefined;
  slug?: string | undefined;

  country?: string | undefined;
  city?: string | undefined;
  stateOrProvince?: string | undefined;
  address?: string | undefined;

  coordinates?: ILocationCoordinates | undefined;

  description?: string | undefined;
  shortDescription?: string | undefined;

  venueDetails?: IVenueDetails | undefined;
  amenities?: string[] | undefined;

  coverImage?: string | undefined;
  gallery?: string[] | undefined;

  featured?: boolean | undefined;
  isActive?: boolean | undefined;
  order?: number | undefined;
}

export interface IRetreatLocationQuery {
  country?: string | undefined;
  city?: string | undefined;
  featured?: boolean | undefined;
  status?: RetreatLocationStatus | undefined;
  isActive?: boolean | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: "name" | "order" | "createdAt" | "country" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}
