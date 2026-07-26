import { Types } from "mongoose";

export const MODULE_RESOURCE_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export const MODULE_RESOURCE_TYPES = [
  "pdf",
  "worksheet",
  "template",
  "external_link",
  "other",
] as const;

export const MODULE_RESOURCE_PROVIDERS = [
  "cloudinary",
  "external",
] as const;

export const CLOUDINARY_RESOURCE_TYPES = [
  "image",
  "raw",
  "video",
] as const;

export type ModuleResourceStatus =
  (typeof MODULE_RESOURCE_STATUSES)[number];

export type ModuleResourceType =
  (typeof MODULE_RESOURCE_TYPES)[number];

export type ModuleResourceProvider =
  (typeof MODULE_RESOURCE_PROVIDERS)[number];

export type CloudinaryResourceType =
  (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export interface IModuleResource {
  module: Types.ObjectId;

  title: string;
  slug: string;
  description?: string | undefined;

  resourceType: ModuleResourceType;
  provider: ModuleResourceProvider;

  fileName?: string | undefined;
  mimeType?: string | undefined;
  format?: string | undefined;
  bytes?: number | undefined;

  cloudinaryPublicId?: string | undefined;
  cloudinaryAssetId?: string | undefined;
  cloudinaryResourceType?: CloudinaryResourceType | undefined;
  secureUrl?: string | undefined;
  externalUrl?: string | undefined;
  thumbnailUrl?: string | undefined;

  isRequired: boolean;
  pointsReward: number;
  order: number;

  status: ModuleResourceStatus;
  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateModuleResourceInput {
  title: string;
  slug: string;
  description?: string | undefined;

  resourceType: ModuleResourceType;
  provider: ModuleResourceProvider;

  externalUrl?: string | undefined;

  isRequired?: boolean | undefined;
  pointsReward?: number | undefined;
  order: number;
}

export interface ICreateModuleResource extends ICreateModuleResourceInput {
  fileName?: string | undefined;
  mimeType?: string | undefined;
  format?: string | undefined;
  bytes?: number | undefined;

  cloudinaryPublicId?: string | undefined;
  cloudinaryAssetId?: string | undefined;
  cloudinaryResourceType?: CloudinaryResourceType | undefined;
  secureUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
}

export interface IUpdateModuleResource {
  title?: string | undefined;
  slug?: string | undefined;
  description?: string | null | undefined;

  resourceType?: ModuleResourceType | undefined;
  provider?: ModuleResourceProvider | undefined;

  fileName?: string | null | undefined;
  mimeType?: string | null | undefined;
  format?: string | null | undefined;
  bytes?: number | null | undefined;

  cloudinaryPublicId?: string | null | undefined;
  cloudinaryAssetId?: string | null | undefined;
  cloudinaryResourceType?: CloudinaryResourceType | null | undefined;
  secureUrl?: string | null | undefined;
  externalUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;

  isRequired?: boolean | undefined;
  pointsReward?: number | undefined;
  order?: number | undefined;
}
