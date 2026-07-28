import { model, Schema } from "mongoose";

import {
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  ENTITLEMENT_TYPES,
  IUserEntitlement,
} from "./userEntitlements.interface";

const userEntitlementSchema = new Schema<IUserEntitlement>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    entitlementType: {
      type: String,
      enum: ENTITLEMENT_TYPES,
      required: true,
      index: true,
    },

    entitlementKey: {
      type: String,
      required: true,
      trim: true,
    },

    pillar: {
      type: Schema.Types.ObjectId,
      ref: "ChallengePillar",
      index: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    source: {
      type: String,
      enum: ENTITLEMENT_SOURCES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ENTITLEMENT_STATUSES,
      default: "active",
      required: true,
      index: true,
    },

    paymentSession: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSession",
      index: true,
    },

    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      index: true,
    },

    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    statusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    statusReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    revokedAt: {
      type: Date,
    },

    refundedAt: {
      type: Date,
    },

    expiredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "userentitlements",
  },
);

/**
 * একই user-এর একই entitlement দ্বিতীয়বার
 * document হিসেবে create হবে না।
 *
 * Revoke হওয়ার পরে আবার grant করলে
 * একই document reactivate হবে।
 */
userEntitlementSchema.index(
  {
    user: 1,
    entitlementKey: 1,
  },
  {
    unique: true,
  },
);

userEntitlementSchema.index({
  user: 1,
  status: 1,
  startsAt: 1,
  expiresAt: 1,
});

userEntitlementSchema.index({
  user: 1,
  pillar: 1,
  status: 1,
});

userEntitlementSchema.index({
  entitlementType: 1,
  status: 1,
  createdAt: -1,
});

export const UserEntitlement = model<IUserEntitlement>(
  "UserEntitlement",
  userEntitlementSchema,
);
