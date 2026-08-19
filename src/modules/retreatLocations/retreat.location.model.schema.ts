import { model, Schema } from "mongoose";

import {
  IRetreatLocation,
  RETREAT_LOCATION_STATUSES,
} from "./retreat.location.interface";

const retreatLocationSchema = new Schema<IRetreatLocation>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    coverImage: {
      type: String,
      trim: true,
    },

    promoVideoUrl: {
      type: String,
      trim: true,
    },

    galleryImages: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    whatsIncluded: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: RETREAT_LOCATION_STATUSES,
      default: "published",
      index: true,
    },

    order: {
      type: Number,
      default: 0,
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
    collection: "retreatlocations",
  },
);

retreatLocationSchema.index({
  isActive: 1,
  status: 1,
  order: 1,
});

export const RetreatLocation = model<IRetreatLocation>(
  "RetreatLocation",
  retreatLocationSchema,
);
