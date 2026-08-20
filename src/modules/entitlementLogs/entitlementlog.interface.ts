import { Types } from "mongoose";

export const ENTITLEMENT_LOG_ACTIONS = [
  "granted",
  "reactivated",
  "revoked",
  "refunded",
  "expired",
] as const;

export const ENTITLEMENT_LOG_SOURCES = [
  "stripe",
  "admin",
  "promotion",
  "complimentary",
  "migration",
  "system",
] as const;

export type EntitlementLogAction = (typeof ENTITLEMENT_LOG_ACTIONS)[number];

export type EntitlementLogSource = (typeof ENTITLEMENT_LOG_SOURCES)[number];

export interface IEntitlementLog {
  user: Types.ObjectId;

  entitlement: Types.ObjectId;

  pillar?: Types.ObjectId | undefined;

  paymentSession?: Types.ObjectId | undefined;

  action: EntitlementLogAction;

  source: EntitlementLogSource;

  reason?: string | undefined;

  /**
   * যে admin/manager/system এই action ঘটিয়েছে।
   * Stripe webhook হলে undefined থাকবে।
   */
  actor?: Types.ObjectId | undefined;

  /**
   * Snapshot রাখার জন্য — future debugging-এ কাজে লাগবে।
   */
  metadata?: Record<string, unknown> | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateEntitlementLogInput {
  user: string;

  entitlement: string;

  pillar?: string | undefined;

  paymentSession?: string | undefined;

  action: EntitlementLogAction;

  source: EntitlementLogSource;

  reason?: string | undefined;

  actor?: string | undefined;

  metadata?: Record<string, unknown> | undefined;
}

export interface IGetEntitlementLogsOptions {
  userId?: string | undefined;

  entitlementId?: string | undefined;

  pillarId?: string | undefined;

  action?: EntitlementLogAction | undefined;

  source?: EntitlementLogSource | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}