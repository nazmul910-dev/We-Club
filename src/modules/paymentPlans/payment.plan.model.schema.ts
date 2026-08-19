import {
  model,
  Schema,
} from "mongoose";

import {
  IPaymentPlan,
  PAYMENT_PLAN_INTERVALS,
  PAYMENT_PLAN_MODES,
  PAYMENT_PLAN_PRODUCT_REF_MODELS,
  PAYMENT_PLAN_PRODUCT_TYPES,
  PAYMENT_PLAN_STATUSES,
} from "./payment.plan.interface";

const paymentPlanSchema =
  new Schema<IPaymentPlan>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 200,
        unique: true,
        index: true,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 2000,
      },

      productType: {
        type: String,
        enum: PAYMENT_PLAN_PRODUCT_TYPES,
        required: true,
        index: true,
      },

      product: {
        type: Schema.Types.ObjectId,
        refPath: "productRefModel",
      },

      productRefModel: {
        type: String,
        enum: PAYMENT_PLAN_PRODUCT_REF_MODELS,
      },

      mode: {
        type: String,
        enum: PAYMENT_PLAN_MODES,
        required: true,
      },

      amountCents: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: "usd",
        lowercase: true,
        trim: true,
      },

      interval: {
        type: String,
        enum: PAYMENT_PLAN_INTERVALS,
      },

      intervalCount: {
        type: Number,
        min: 1,
        default: 1,
      },

      stripeProductId: {
        type: String,
        trim: true,
      },

      stripePriceId: {
        type: String,
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
        required: true,
      },

      status: {
        type: String,
        enum: PAYMENT_PLAN_STATUSES,
        default: "draft",
        index: true,
      },

      order: {
        type: Number,
        default: 1,
        min: 1,
      },

      publishedAt: {
        type: Date,
      },

      archivedAt: {
        type: Date,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      collection: "paymentplans",
    }
  );

paymentPlanSchema.index({
  productType: 1,
  status: 1,
  order: 1,
});

paymentPlanSchema.index({
  product: 1,
  productRefModel: 1,
});

paymentPlanSchema.index({
  mode: 1,
  status: 1,
});

// A plan tied to a specific product (pillar/retreat batch) must be unique per product + mode
paymentPlanSchema.index(
  {
    product: 1,
    mode: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      product: { $exists: true },
    },
  }
);

export const PaymentPlan =
  model<IPaymentPlan>(
    "PaymentPlan",
    paymentPlanSchema
  );
