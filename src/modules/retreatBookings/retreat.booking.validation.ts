import { z } from "zod";

import { RETREAT_BOOKING_STATUSES } from "./retreat.booking.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const emergencyContactSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(50).optional(),
    relationship: z.string().trim().max(50).optional(),
  })
  .optional();

export const createRetreatBookingValidation = z.object({
  body: z
    .object({
      retreatBatch: mongoObjectIdSchema,
      notes: z.string().trim().max(2000).optional(),
      specialRequests: z.string().trim().max(2000).optional(),
      dietaryRequirements: z.string().trim().max(1000).optional(),
      emergencyContact: emergencyContactSchema,
    })
    .strict(),
});

export const updateRetreatBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      notes: z.string().trim().max(2000).optional(),
      specialRequests: z.string().trim().max(2000).optional(),
      dietaryRequirements: z.string().trim().max(1000).optional(),
      emergencyContact: emergencyContactSchema,
    })
    .strict(),
});

export const inviteRetreatBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      invitationExpiresInHours: z.number().int().min(1).max(720).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .strict(),
});

export const cancelRetreatBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(3, "Cancellation reason must be at least 3 characters")
        .max(1000),
    })
    .strict(),
});

export const refundRetreatBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      refundAmount: z.number().min(0).optional(),
      reason: z.string().trim().max(1000).optional(),
    })
    .strict(),
});

export const confirmRetreatBookingAdminValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      amountPaid: z.number().min(0).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .strict(),
});

export const retreatBookingIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const queryRetreatBookingValidation = z.object({
  query: z
    .object({
      userId: mongoObjectIdSchema.optional(),
      batchId: mongoObjectIdSchema.optional(),
      locationId: mongoObjectIdSchema.optional(),
      status: z.enum(RETREAT_BOOKING_STATUSES).optional(),
      search: z.string().trim().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
});
