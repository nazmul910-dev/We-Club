import { Schema, model } from "mongoose";
import {
  IPaymentSession,
  PAYMENT_PURPOSES,
  PAYMENT_SESSION_STATUSES,
} from "./payment.interface";
import { USER_ROLES, ACCESS_TO_OPTIONS } from "../users/user.interface";

const PaymentSessionSchema = new Schema<IPaymentSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
    },

    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS,
    },
    purpose: {
      type: String,
      enum: PAYMENT_PURPOSES,
      required: true,
    },

    durationMonths: {
      type: Number,
      enum: [3, 6, 12],
    },
    status: {
      type: String,
      enum: PAYMENT_SESSION_STATUSES,
      default: "pending",
      index: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    stripeCustomerId: {
      type: String,
      trim: true,
    },

    stripeSubscriptionId: {
      type: String,
      trim: true,
    },

    checkoutUrl: {
      type: String,
      trim: true,
    },

    amountTotal: {
      type: Number,
      min: 0,
    },

    originalAmountTotal: {
      type: Number,
      min: 0,
    },

    discountAmountTotal: {
      type: Number,
      min: 0,
    },

    discountCode: {
      type: String,
      trim: true,
    },

    discountPercent: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
    },

    paymentPlan: {
      type: Schema.Types.ObjectId,
      ref: "PaymentPlan",
      index: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      refPath: "productRefModel",
    },

    productRefModel: {
      type: String,
      enum: ["ChallengePillar", "RetreatBatch"],
    },

    entitlementActivatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentSession = model<IPaymentSession>(
  "PaymentSession",
  PaymentSessionSchema,
);
