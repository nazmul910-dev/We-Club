import { Types } from "mongoose";

export const MODULE_VIDEO_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export const VIDEO_UPLOAD_STATUSES = [
  "processing",
  "ready",
  "failed",
] as const;

export type ModuleVideoStatus =
  (typeof MODULE_VIDEO_STATUSES)[number];

export type VideoUploadStatus =
  (typeof VIDEO_UPLOAD_STATUSES)[number];

export interface IModuleVideo {
  module: Types.ObjectId;

  title: string;
  slug: string;
  description?: string | undefined;

  provider: "cloudinary";
  resourceType: "video";

  cloudinaryPublicId: string;
  cloudinaryAssetId?: string | undefined;

  secureUrl: string;
  playbackUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  folder?: string | undefined;

  format?: string | undefined;
  durationSeconds: number;
  bytes?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;

  isPaid: boolean;

  isRequired: boolean;
  requiredWatchPercent: number;
  pointsReward: number;
  order: number;

  uploadStatus: VideoUploadStatus;
  status: ModuleVideoStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  uploadedBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateModuleVideoInput {
  title: string;
  slug: string;
  description?: string | undefined;

  isPaid?: boolean | undefined;

  isRequired?: boolean | undefined;
  requiredWatchPercent?: number | undefined;
  pointsReward?: number | undefined;
  order: number;
}

export interface ICreateModuleVideo extends ICreateModuleVideoInput {
  cloudinaryPublicId: string;
  cloudinaryAssetId?: string | undefined;

  secureUrl: string;
  playbackUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  folder?: string | undefined;

  format?: string | undefined;
  durationSeconds: number;
  bytes?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;

  uploadStatus?: VideoUploadStatus | undefined;
}

export interface IUpdateModuleVideo {
  title?: string | undefined;
  slug?: string | undefined;
  description?: string | null | undefined;

  cloudinaryPublicId?: string | undefined;
  cloudinaryAssetId?: string | null | undefined;

  secureUrl?: string | undefined;
  playbackUrl?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  folder?: string | null | undefined;

  format?: string | null | undefined;
  durationSeconds?: number | undefined;
  bytes?: number | null | undefined;
  width?: number | null | undefined;
  height?: number | null | undefined;

  isPaid?: boolean | undefined;

  isRequired?: boolean | undefined;
  requiredWatchPercent?: number | undefined;
  pointsReward?: number | undefined;
  order?: number | undefined;

  uploadStatus?: VideoUploadStatus | undefined;
}
