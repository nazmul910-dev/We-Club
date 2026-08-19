import { z } from "zod";

import {
  PAYMENT_PLAN_INTERVALS,
  PAYMENT_PLAN_MODES,
  PAYMENT_PLAN_PRODUCT_REF_MODELS,
  PAYMENT_PLAN_PRODUCT_TYPES,
} from "./payment.plan.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must be lowercase, alphanumeric, and hyphen-separated"
  );

const createPaymentPlanBodySchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(200),

      slug: slugSchema,

      description: z
        .string()
        .trim()
        .max(2000)
        .optional(),

      productType: z.enum(
        PAYMENT_PLAN_PRODUCT_TYPES
      ),

      product:
        mongoObjectIdSchema.optional(),

      productRefModel: z
        .enum(
          PAYMENT_PLAN_PRODUCT_REF_MODELS
        )
        .optional(),

      mode: z.enum(
        PAYMENT_PLAN_MODES
      ),

      amountCents: z
        .number()
        .int()
        .min(0),

      currency: z
        .string()
        .trim()
        .length(3)
        .optional(),

      interval: z
        .enum(
          PAYMENT_PLAN_INTERVALS
        )
        .optional(),

      intervalCount: z
        .number()
        .int()
        .min(1)
        .optional(),

      stripeProductId: z
        .string()
        .trim()
        .max(200)
        .optional(),

      stripePriceId: z
        .string()
        .trim()
        .max(200)
        .optional(),

      order: z
        .number()
        .int()
        .min(1)
        .optional(),
    })
    .refine(
      (body) =>
        (body.product === undefined &&
          body.productRefModel ===
            undefined) ||
        (body.product !== undefined &&
          body.productRefModel !==
            undefined),
      {
        message:
          "product and productRefModel must be provided together",
      }
    );

const updatePaymentPlanBodySchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(200)
        .optional(),

      slug: slugSchema.optional(),

      description: z
        .string()
        .trim()
        .max(2000)
        .nullable()
        .optional(),

      productType: z
        .enum(
          PAYMENT_PLAN_PRODUCT_TYPES
        )
        .optional(),

      product: mongoObjectIdSchema
        .nullable()
        .optional(),

      productRefModel: z
        .enum(
          PAYMENT_PLAN_PRODUCT_REF_MODELS
        )
        .nullable()
        .optional(),

      mode: z
        .enum(PAYMENT_PLAN_MODES)
        .optional(),

      amountCents: z
        .number()
        .int()
        .min(0)
        .optional(),

      currency: z
        .string()
        .trim()
        .length(3)
        .optional(),

      interval: z
        .enum(
          PAYMENT_PLAN_INTERVALS
        )
        .nullable()
        .optional(),

      intervalCount: z
        .number()
        .int()
        .min(1)
        .nullable()
        .optional(),

      stripeProductId: z
        .string()
        .trim()
        .max(200)
        .nullable()
        .optional(),

      stripePriceId: z
        .string()
        .trim()
        .max(200)
        .nullable()
        .optional(),

      order: z
        .number()
        .int()
        .min(1)
        .optional(),
    })
    .refine(
      (body) =>
        Object.keys(body).length > 0,
      {
        message:
          "At least one field is required",
      }
    );

export const createPaymentPlanValidation =
  z.object({
    body: createPaymentPlanBodySchema,
  });

export const updatePaymentPlanValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),

    body: updatePaymentPlanBodySchema,
  });

export const paymentPlanIdValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),
  });

export const paymentPlanSlugValidation =
  z.object({
    params: z.object({
      slug: z
        .string()
        .trim()
        .min(2)
        .max(200),
    }),
  });
