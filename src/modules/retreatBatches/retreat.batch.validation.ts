import { z } from "zod";

import { RETREAT_BATCH_STATUSES } from "./retreat.batch.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createRetreatBatchValidation = z.object({
  body: z
    .object({
      retreatLocation: mongoObjectIdSchema,
      batchName: z.string().trim().min(2).max(200),
      slug: z.string().trim().min(2).max(200).optional(),

      startDate: z
        .string()
        .datetime({ message: "startDate must be a valid ISO 8601 datetime" }),
      endDate: z
        .string()
        .datetime({ message: "endDate must be a valid ISO 8601 datetime" }),

      capacity: z.number().int().min(1),
      price: z.number().min(0),
      depositAmount: z.number().min(0).optional(),
      currency: z.string().trim().min(2).max(10).optional(),

      status: z.enum(RETREAT_BATCH_STATUSES).optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),

      bookingDeadline: z
        .string()
        .datetime({ message: "bookingDeadline must be a valid ISO 8601 datetime" })
        .optional(),
      description: z.string().trim().max(3000).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .strict(),
});

export const updateRetreatBatchValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      retreatLocation: mongoObjectIdSchema.optional(),
      batchName: z.string().trim().min(2).max(200).optional(),
      slug: z.string().trim().min(2).max(200).optional(),

      startDate: z
        .string()
        .datetime({ message: "startDate must be a valid ISO 8601 datetime" })
        .optional(),
      endDate: z
        .string()
        .datetime({ message: "endDate must be a valid ISO 8601 datetime" })
        .optional(),

      capacity: z.number().int().min(1).optional(),
      price: z.number().min(0).optional(),
      depositAmount: z.number().min(0).nullable().optional(),
      currency: z.string().trim().min(2).max(10).optional(),

      status: z.enum(RETREAT_BATCH_STATUSES).optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),

      bookingDeadline: z
        .string()
        .datetime({ message: "bookingDeadline must be a valid ISO 8601 datetime" })
        .nullable()
        .optional(),
      description: z.string().trim().max(3000).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .strict(),
});

export const retreatBatchIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const queryRetreatBatchValidation = z.object({
  query: z
    .object({
      locationId: mongoObjectIdSchema.optional(),
      status: z.enum(RETREAT_BATCH_STATUSES).optional(),
      isActive: z.coerce.boolean().optional(),
      isFeatured: z.coerce.boolean().optional(),
      startDateFrom: z.string().optional(),
      startDateTo: z.string().optional(),
      search: z.string().trim().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
});
