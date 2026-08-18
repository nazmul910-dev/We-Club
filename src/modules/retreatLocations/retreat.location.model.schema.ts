import { model, Schema } from "mongoose";

import {
  ILocationCoordinates,
  IRetreatLocation,
  IVenueDetails,
  RETREAT_LOCATION_STATUSES,
} from "./retreat.location.interface";

const venueDetailsSchema = new Schema<IVenueDetails>(
  {
    venueName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    capacity: {
      type: Number,
      min: 1,
    },
    accommodationType: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    features: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const locationCoordinatesSchema = new Schema<ILocationCoordinates>(
  {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  {
    _id: false,
  },
);

const retreatLocationSchema = new Schema<IRetreatLocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    stateOrProvince: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    coordinates: {
      type: locationCoordinatesSchema,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    venueDetails: {
      type: venueDetailsSchema,
    },

    amenities: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    coverImage: {
      type: String,
      required: true,
      trim: true,
    },

    gallery: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: RETREAT_LOCATION_STATUSES,
      default: "draft",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
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
    collection: "retreatlocations",
  },
);

retreatLocationSchema.index({
  status: 1,
  isActive: 1,
  order: 1,
});

retreatLocationSchema.index({
  country: 1,
  city: 1,
  status: 1,
});

retreatLocationSchema.index({
  featured: 1,
  status: 1,
  isActive: 1,
});

retreatLocationSchema.index({
  name: "text",
  description: "text",
  country: "text",
  city: "text",
});

export const RetreatLocation = model<IRetreatLocation>(
  "RetreatLocation",
  retreatLocationSchema,
);
