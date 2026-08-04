import { Document, Types } from "mongoose";

export type ListingStatus = "active" | "pending" | "sold" | "draft" | "cancelled" | "rejected";
export type PromoteReqStatus = "pending" | "approved" | "rejected";

export interface ILocation {
  city: string;
  region: string;
  country: string;
}

export type AreaUnit = 
  | "sqft"
  | "sqm"
  | "acre"
  | "katha"
  | "decimal"
  | "bigha";

export interface IArea {
  value: number;
  unit: AreaUnit;
}

export interface IPrice {
  amount: number;
  currency: string;
}

export interface IReferralCommission {
  offered_amount: number;
  confirmed_amount?: number;
}

export interface IListing {
  id: Types.ObjectId;
  title: string;
  ref_code: string;
  status: ListingStatus;
  location: ILocation;
  price: IPrice;
  bedrooms: number;
  bathrooms: number;
  area_sqm: IArea;
  referral_commission: IReferralCommission;
  cover_image: string;
  images: string[];
  associate_id: Types.ObjectId;   
  promoters: Types.ObjectId[];  
  listings_view : number;
  sold_at?: Date;
  is_sale_finalized?: boolean;
  is_deleted : boolean;
  deleted_at? : Date;  
  created_at: Date;
  updated_at: Date;
}


