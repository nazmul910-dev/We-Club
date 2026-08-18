import { z } from "zod";

import { MENTORSHIP_REVIEW_STATUSES } from "./mentorship.review.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createMentorshipReviewValidation = z.object({
  body: z
    .object({
      booking: mongoObjectIdSchema,
      mentor: mongoObjectIdSchema,
      mentorshipProfile: mongoObjectIdSchema.optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().max(2000).optional(),
      isAnonymous: z.boolean().optional(),
    })
    .strict(),
});

export const updateMentorshipReviewValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
  body: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      comment: z.string().trim().max(2000).nullable().optional(),
      isAnonymous: z.boolean().optional(),
    })
    .strict(),
});

export const moderateMentorshipReviewValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
  body: z
    .object({
      status: z.enum(MENTORSHIP_REVIEW_STATUSES),
      adminNotes: z.string().trim().max(1000).optional(),
    })
    .strict(),
});

export const mentorshipReviewIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const mentorIdParamValidation = z.object({
  params: z.object({
    mentorId: mongoObjectIdSchema,
  }),
});
