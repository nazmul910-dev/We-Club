import { Document, Types } from "mongoose";

export interface IPromotedListing {
  listing_id: Types.ObjectId;
  listing_title: Types.ObjectId;
  listing_price: Types.ObjectId;
  listing_owner_id: Types.ObjectId;
  promotion_request_id: Types.ObjectId;

  tier: "tier_1" | "tier_2" | "tier_3";

  approved_by: Types.ObjectId;
  approved_at: Date;

  status: "active" | "inactive";
}

export interface IPromoter extends Document {
  user_id: Types.ObjectId;
  listings: IPromotedListing[];
  profile_views: number;
  createdAt: Date;
  updatedAt: Date;
}
