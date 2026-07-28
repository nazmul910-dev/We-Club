import { Types } from "mongoose";

export const ENTITLEMENT_TYPES = [
  "pillar",
  "bundle",
  "event",
  "retreat",
] as const;

export const ENTITLEMENT_SOURCES = [
  "stripe",
  "admin",
  "promotion",
  "complimentary",
  "migration",
] as const;

export const ADMIN_ENTITLEMENT_SOURCES = [
  "admin",
  "promotion",
  "complimentary",
  "migration",
] as const;

export const ENTITLEMENT_STATUSES = [
  "active",
  "revoked",
  "refunded",
  "expired",
] as const;

export type EntitlementType = (typeof ENTITLEMENT_TYPES)[number];

export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export type AdminEntitlementSource = (typeof ADMIN_ENTITLEMENT_SOURCES)[number];

export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export interface IUserEntitlement {
  user: Types.ObjectId;

  entitlementType: EntitlementType;

  /**
   * Example:
   * pillar:668abc...
   * event:668abc...
   *
   * user + entitlementKey unique থাকবে।
   */
  entitlementKey: string;

  /**
   * Pillar entitlement হলে এটি থাকবে।
   */
  pillar?: Types.ObjectId | undefined;

  /**
   * Future bundle/event/retreat entitlement-এর জন্য।
   */
  targetId?: Types.ObjectId | undefined;

  source: EntitlementSource;
  status: EntitlementStatus;

  paymentSession?: Types.ObjectId | undefined;

  startsAt: Date;
  expiresAt?: Date | undefined;

  grantedBy?: Types.ObjectId | undefined;

  statusChangedBy?: Types.ObjectId | undefined;

  statusReason?: string | undefined;

  revokedAt?: Date | undefined;
  refundedAt?: Date | undefined;
  expiredAt?: Date | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IGrantUserEntitlementInput {
  user: string;

  entitlementType?: EntitlementType | undefined;

  pillar?: string | undefined;
  targetId?: string | undefined;

  source?: AdminEntitlementSource | undefined;

  paymentSession?: string | undefined;

  startsAt?: string | undefined;

  expiresAt?: string | null | undefined;
}

export interface IActivatePillarFromPaymentInput {
  userId: string;
  pillarId: string;

  paymentSessionId: string;

  startsAt?: Date | undefined;
  expiresAt?: Date | undefined;
}

export interface IReactivateEntitlementInput {
  source?: AdminEntitlementSource | undefined;

  startsAt?: string | undefined;

  expiresAt?: string | null | undefined;
}

export interface IEntitlementStatusInput {
  reason?: string | undefined;
}

export interface IGetEntitlementsOptions {
  userId?: string | undefined;
  pillarId?: string | undefined;

  entitlementType?: EntitlementType | undefined;

  source?: EntitlementSource | undefined;

  status?: EntitlementStatus | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
