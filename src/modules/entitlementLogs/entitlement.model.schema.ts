import { model, Schema } from "mongoose";

import {
  ENTITLEMENT_LOG_ACTIONS,
  ENTITLEMENT_LOG_SOURCES,
  IEntitlementLog,
} from "./entitlementlog.interface";

const entitlementLogSchema = new Schema<IEntitlementLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    entitlement: {
      type: Schema.Types.ObjectId,
      ref: "UserEntitlement",
      required: true,
      index: true,
    },

    pillar: {
      type: Schema.Types.ObjectId,
      ref: "ChallengePillar",
      index: true,
    },

    paymentSession: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSession",
      index: true,
    },

    action: {
      type: String,
      enum: ENTITLEMENT_LOG_ACTIONS,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ENTITLEMENT_LOG_SOURCES,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "entitlementslog",
  },
);

/**
 * Append-only audit history — কোনো update/delete
 * middleware/method এখানে দেওয়া হয়নি ইচ্ছাকৃতভাবে।
 */
entitlementLogSchema.index({
  user: 1,
  createdAt: -1,
});

entitlementLogSchema.index({
  entitlement: 1,
  createdAt: -1,
});

entitlementLogSchema.index({
  action: 1,
  createdAt: -1,
});

export const EntitlementLog = model<IEntitlementLog>(
  "EntitlementLog",
  entitlementLogSchema,
);