import { model, Schema } from "mongoose";

import {
  CLOUDINARY_RESOURCE_TYPES,
  IModuleResource,
  MODULE_RESOURCE_PROVIDERS,
  MODULE_RESOURCE_STATUSES,
  MODULE_RESOURCE_TYPES,
} from "./module.resource.interface";

const moduleResourceSchema = new Schema<IModuleResource>(
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

    resourceType: {
      type: String,
      enum: MODULE_RESOURCE_TYPES,
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: MODULE_RESOURCE_PROVIDERS,
      required: true,
    },

    fileName: {
      type: String,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    format: {
      type: String,
      trim: true,
    },

    bytes: {
      type: Number,
      min: 0,
    },

    cloudinaryPublicId: {
      type: String,
      trim: true,
    },

    cloudinaryAssetId: {
      type: String,
      trim: true,
    },

    cloudinaryResourceType: {
      type: String,
      enum: CLOUDINARY_RESOURCE_TYPES,
    },

    secureUrl: {
      type: String,
      trim: true,
    },

    externalUrl: {
      type: String,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
    },

    isRequired: {
      type: Boolean,
      default: true,
    },

    pointsReward: {
      type: Number,
      default: 5,
      min: 0,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: MODULE_RESOURCE_STATUSES,
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
    },

    archivedAt: {
      type: Date,
    },

    createdBy: {
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
    collection: "moduleresources",
  }
);

moduleResourceSchema.index(
  { module: 1, order: 1 },
  { unique: true }
);

moduleResourceSchema.index(
  { module: 1, slug: 1 },
  { unique: true }
);

moduleResourceSchema.index(
  { cloudinaryPublicId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

moduleResourceSchema.index({
  module: 1,
  status: 1,
  order: 1,
});

export const ModuleResource = model<IModuleResource>(
  "ModuleResource",
  moduleResourceSchema
);
