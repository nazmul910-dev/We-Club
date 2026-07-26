import { model, Schema } from "mongoose";

import {
  IModuleVideo,
  MODULE_VIDEO_STATUSES,
  VIDEO_UPLOAD_STATUSES,
} from "./module.video.interface";

const moduleVideoSchema = new Schema<IModuleVideo>(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    provider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["video"],
      default: "video",
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
      trim: true,
    },

    cloudinaryAssetId: {
      type: String,
      trim: true,
    },

    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },

    playbackUrl: {
      type: String,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
    },

    folder: {
      type: String,
      trim: true,
    },

    format: {
      type: String,
      trim: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    bytes: {
      type: Number,
      min: 0,
    },

    width: {
      type: Number,
      min: 0,
    },

    height: {
      type: Number,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },

    requiredWatchPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100,
    },

    pointsReward: {
      type: Number,
      default: 10,
      min: 0,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    uploadStatus: {
      type: String,
      enum: VIDEO_UPLOAD_STATUSES,
      default: "ready",
      index: true,
    },

    status: {
      type: String,
      enum: MODULE_VIDEO_STATUSES,
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
    },

    archivedAt: {
      type: Date,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "modulevideos",
  },
);

moduleVideoSchema.index({ module: 1, order: 1 }, { unique: true });

moduleVideoSchema.index({ module: 1, slug: 1 }, { unique: true });

moduleVideoSchema.index({ cloudinaryPublicId: 1 }, { unique: true });

moduleVideoSchema.index({
  module: 1,
  status: 1,
  order: 1,
});

export const ModuleVideo = model<IModuleVideo>(
  "ModuleVideo",
  moduleVideoSchema,
);
