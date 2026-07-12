import { Schema, model, Types, Document } from "mongoose";
import { IPromoter } from "./promoters.interface";

const promotedListingSchema = new Schema(
  {
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    listing_title: {
      type:  String,
      ref: "Listing",
      required: true,
    },
    listing_price: {
      type: Number,
      ref: "Listing",
      required: true,
    },

    listing_owner_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    promotion_request_id: {
      type: Schema.Types.ObjectId,
      ref: "PromoteRequest",
      required: true,
    },

    tier: {
      type: String,
      enum: ["tier_1", "tier_2", "tier_3"],
      required: true,
    },

    approved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approved_at: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    _id: false,
  },
);

const promoterSchema = new Schema<IPromoter>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    user_id : {
      type : Schema.Types.ObjectId,
      ref : "User",
      
    },

    listings: {
      type: [promotedListingSchema],
      default: [],
    },
    profile_views : {
      type : Number,
      default : 10
    }
  },
  {
    timestamps: true,
  },
);

export const Promoter = model<IPromoter>("Promoter", promoterSchema);
