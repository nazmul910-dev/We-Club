import { Schema, model, Types, Document } from "mongoose";
import { IListing, ILocation, IPrice, IReferralCommission } from "./listings.interface";


export type ListingStatus = "active" | "pending" | "sold" | "draft";



const LocationSchema = new Schema<ILocation>(
  {
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const PriceSchema = new Schema<IPrice>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

const ReferralCommissionSchema = new Schema<IReferralCommission>(
  {
    offered_amount: { type: Number, required: true },
    confirmed_amount: { type: Number },
  },
  { _id: false }
);

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true, trim: true },
    ref_code: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "draft"],
      default: "draft",
    },
    
    location: { type: LocationSchema, required: true },
    price: { type: PriceSchema, required: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    area_sqm: { type: Number, required: true, min: 0 },
    referral_commission: { type: ReferralCommissionSchema, required: true },
    cover_image: { type: String, required: true },
    images: { type: [String], default: [] },

    associate_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    promoters: {
    type: [{
        _id: false,
        user_id: { type: Schema.Types.ObjectId, ref: "User" },
        tier: { type: String, enum: ["tier_1", "tier_2", "tier_3"] },
    }],
     default: [],
    },
    is_deleted : {
    type : Boolean,
    default : false,
  },
  deleted_at : {
    type : Date
  }
  },
  
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }

);

// Indexes
ListingSchema.index({ status: 1 });
ListingSchema.index({ "location.country": 1 });
ListingSchema.index({ associate_id: 1 });
ListingSchema.index({ ref_code: 1 }, { unique: true });
ListingSchema.index({ is_deleted: 1 });

ListingSchema.pre(/^find/, function (this: any) {
  if (this.getFilter().is_deleted === undefined) {
    this.where({ is_deleted: false });
  }
});

export const Listing = model<IListing>("Listing", ListingSchema);