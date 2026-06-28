import { Types } from 'mongoose';

export const COMMISSION_STATUSES = [
  'pending',
  'confirmed',
  'paid',
  'disputed',
  'cancelled',
] as const;

export const COMMISSION_PAYMENT_METHODS = [
  'bank_transfer',
  'stripe',
  'helcim',
  'cash',
  'check',
  'other',
] as const;

export const PLATFORM_FEE_STATUSES = [
  'not_required',
  'pending',
  'paid',
  'failed',
] as const;

export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export type CommissionPaymentMethod =
  (typeof COMMISSION_PAYMENT_METHODS)[number];

export type PlatformFeeStatus = (typeof PLATFORM_FEE_STATUSES)[number];

export interface ICommissionStatusHistory {
  status: CommissionStatus;
  changed_by: Types.ObjectId;
  changed_at: Date;
  note?: string;
}

export interface ICommissionPaymentTracking {
  marked_paid_by?: Types.ObjectId;
  marked_paid_at?: Date;

  receiver_confirmed_by?: Types.ObjectId;
  receiver_confirmed_at?: Date;

  payment_method?: CommissionPaymentMethod;
  payment_reference?: string;
  note?: string;
}

export interface ICommissionDispute {
  opened_by?: Types.ObjectId;
  opened_at?: Date;
  reason?: string;

  resolved_by?: Types.ObjectId;
  resolved_at?: Date;
  resolution_note?: string;
}

export interface ICommissionPlatformFee {
  rate_percent: number;
  amount: number;
  status: PlatformFeeStatus;
  provider?: 'stripe' | 'helcim';
  provider_payment_id?: string;
  paid_at?: Date;
}

export interface ICommissionLedger {
  listing_id: Types.ObjectId;
  promotion_request_id?: Types.ObjectId;

  listing_owner_id: Types.ObjectId;
  promoter_id: Types.ObjectId;

  created_by: Types.ObjectId;

  status: CommissionStatus;

  currency: string;

  listing_price_amount: number;
  commission_rate_percent: number;

  estimated_commission_amount: number;
  final_commission_amount?: number;

  deal_closed_at?: Date;

  payment_tracking?: ICommissionPaymentTracking;
  dispute?: ICommissionDispute;
  platform_fee?: ICommissionPlatformFee;

  status_history: ICommissionStatusHistory[];

  is_frozen: boolean;

  note?: string;

  created_at?: Date;
  updated_at?: Date;
}