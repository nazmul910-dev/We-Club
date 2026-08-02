import { Schema, model, Types, Document } from "mongoose";

export type PromoteReqStatus = "pending" |"owner_approved" | "approved" | "rejected" | "cancelled" | "promoter_rejected";

export type PromotionTier = "tier_1" | "tier_2" | "tier_3";

export type PromoterAgreementStatus =
  | "not_started"
  | "pending"
  | "accepted"
  | "rejected";

export const TIER_PERMISSIONS: Record<PromotionTier, {
  address_revealed: boolean;
  full_photography: boolean;
  can_publish_website: boolean;
  newsletter: boolean;
  print_collateral: boolean;
  requires_nda: boolean;
  direct_intro_only: boolean;
}> = {
  tier_1: {
    address_revealed: true,
    full_photography: true,
    can_publish_website: true,
    newsletter: true,
    print_collateral: false,
    requires_nda: false,
    direct_intro_only: false,
  },
  tier_2: {
    address_revealed: true,
    full_photography: true,
    can_publish_website: false,
    newsletter: false,
    print_collateral: true,
    requires_nda: false,
    direct_intro_only: false,
  },
  tier_3: {
    address_revealed: false,
    full_photography: false,
    can_publish_website: false,
    newsletter: false,
    print_collateral: false,
    requires_nda: true,
    direct_intro_only: true,
  },
};




export interface IPromoteRequest extends Document {
  listing_id: Types.ObjectId;
  requester: {
    user_id: Types.ObjectId;
    email: string;
  };
  proposed_commission_pct: number;
  confirmed_commission_pct?: number;
  marketing_channels: string[];
  message?: string;
  status: PromoteReqStatus;
  is_deleted: boolean;
  selected_tier: PromotionTier | null;

   promoter_agreement_status: PromoterAgreementStatus;

  promoter_website_url?: string | undefined;
  marketing_document_url?: string | undefined;
  access_url?: string | undefined;

  promoter_rejection_reason?: string;
  promoter_rejected_at?: Date;

  deleted_at?: Date;
  requested_at: Date;
  owner_approved_at?: Date;
  promoter_accepted_at?: Date;
  resolved_at?: Date | undefined;
}