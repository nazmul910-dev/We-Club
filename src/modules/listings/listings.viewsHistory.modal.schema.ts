import { Schema, model, Types } from "mongoose";

const listingViewStatsSchema = new Schema(
  {
    listing: {
      type: Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One document per listing per day
listingViewStatsSchema.index(
  {
    listing: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

export const ListingViewStats = model(
  "ListingViewStats",
  listingViewStatsSchema
);