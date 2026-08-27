import { z } from "zod";

import {
  MENTOR_BOOKING_STATUSES,
  NO_SHOW_PARTIES,
} from "./mentor.booking.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createMentorBookingValidation = z.object({
  body: z
    .object({
      leadMentor: mongoObjectIdSchema,
      leadMentorProfile: mongoObjectIdSchema.optional(),

      coMentor: mongoObjectIdSchema.optional(),
      coMentorProfile: mongoObjectIdSchema.optional(),

      scheduledStartTime: z
        .string()
        .datetime({ message: "scheduledStartTime must be a valid ISO 8601 datetime" }),

      durationMinutes: z.number().int().min(15).max(180).optional(),

      timezone: z.string().trim().min(1).max(100),

      sessionTopic: z.string().trim().min(2).max(500).optional(),
      notes: z.string().trim().max(2000).optional(),
      meetingUrl: z.string().trim().url().optional(),
    })
    .strict(),
});

export const updateMentorBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      leadMentor: mongoObjectIdSchema.optional(),
      leadMentorProfile: mongoObjectIdSchema.optional(),

      coMentor: mongoObjectIdSchema.nullable().optional(),
      coMentorProfile: mongoObjectIdSchema.nullable().optional(),

      scheduledStartTime: z
        .string()
        .datetime({ message: "scheduledStartTime must be a valid ISO 8601 datetime" })
        .optional(),

      durationMinutes: z.number().int().min(15).max(180).optional(),

      timezone: z.string().trim().min(1).max(100).optional(),

      sessionTopic: z.string().trim().min(2).max(500).optional(),
      notes: z.string().trim().max(2000).optional(),
      meetingUrl: z.string().trim().url().nullable().optional(),
    })
    .strict(),
});

export const confirmMentorBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      meetingUrl: z.string().trim().url().optional(),
    })
    .strict(),
});

export const cancelMentorBookingValidation = z.object({
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

export const completeMentorBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      recordingTitle: z
        .string()
        .trim()
        .min(3, "Recording title must be at least 3 characters")
        .max(200),
      mentorFeedback: z.string().trim().max(3000).optional(),
    })
    .strict(),
});

export const noShowMentorBookingValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      noShowBy: z.enum(NO_SHOW_PARTIES),
      reason: z.string().trim().max(1000).optional(),
    })
    .strict(),
});

export const mentorBookingIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const queryMentorBookingValidation = z.object({
  query: z
    .object({
      memberId: mongoObjectIdSchema.optional(),
      leadMentorId: mongoObjectIdSchema.optional(),
      coMentorId: mongoObjectIdSchema.optional(),
      mentorId: mongoObjectIdSchema.optional(),

      status: z.enum(MENTOR_BOOKING_STATUSES).optional(),

      startDate: z.string().optional(),
      endDate: z.string().optional(),

      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
});