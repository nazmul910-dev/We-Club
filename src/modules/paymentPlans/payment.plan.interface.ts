import { Types } from "mongoose";

export const PAYMENT_PLAN_MODES = [
  "one_time",
  "subscription",
] as const;

export type PaymentPlanMode = (typeof PAYMENT_PLAN_MODES)[number];

export const PAYMENT_PLAN_PRODUCT_TYPES = [
  "membership",
  "pillar",
  "retreat",
  "event",
  "other",
] as const;

export type PaymentPlanProductType =
  (typeof PAYMENT_PLAN_PRODUCT_TYPES)[number];

export const PAYMENT_PLAN_PRODUCT_REF_MODELS = [
  "ChallengePillar",
  "RetreatBatch",
] as const;

export type PaymentPlanProductRefModel =
  (typeof PAYMENT_PLAN_PRODUCT_REF_MODELS)[number];

export const PAYMENT_PLAN_INTERVALS = [
  "day",
  "week",
  "month",
  "year",
] as const;

export type PaymentPlanInterval =
  (typeof PAYMENT_PLAN_INTERVALS)[number];

export const PAYMENT_PLAN_STATUSES = [
  "draft",
  "active",
  "archived",
] as const;

export type PaymentPlanStatus =
  (typeof PAYMENT_PLAN_STATUSES)[number];

export interface IPaymentPlan {
  name: string;
  slug: string;
  description?: string | undefined;

  productType: PaymentPlanProductType;

  product?: Types.ObjectId | undefined;
  productRefModel?: PaymentPlanProductRefModel | undefined;

  mode: PaymentPlanMode;

  amountCents: number;
  currency: string;

  interval?: PaymentPlanInterval | undefined;
  intervalCount?: number | undefined;

  stripeProductId?: string | undefined;
  stripePriceId?: string | undefined;

  isActive: boolean;
  status: PaymentPlanStatus;

  order: number;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreatePaymentPlan {
  name: string;
  slug: string;
  description?: string | undefined;

  productType: PaymentPlanProductType;

  product?: string | undefined;
  productRefModel?: PaymentPlanProductRefModel | undefined;

  mode: PaymentPlanMode;

  amountCents: number;
  currency?: string | undefined;

  interval?: PaymentPlanInterval | undefined;
  intervalCount?: number | undefined;

  stripeProductId?: string | undefined;
  stripePriceId?: string | undefined;

  order?: number | undefined;
}

export interface IUpdatePaymentPlan {
  name?: string | undefined;
  slug?: string | undefined;

  description?: string | null | undefined;

  productType?: PaymentPlanProductType | undefined;

  product?: string | null | undefined;
  productRefModel?: PaymentPlanProductRefModel | null | undefined;

  mode?: PaymentPlanMode | undefined;

  amountCents?: number | undefined;
  currency?: string | undefined;

  interval?: PaymentPlanInterval | null | undefined;
  intervalCount?: number | null | undefined;

  stripeProductId?: string | null | undefined;
  stripePriceId?: string | null | undefined;

  order?: number | undefined;
}
