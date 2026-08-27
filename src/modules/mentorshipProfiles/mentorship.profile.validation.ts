import { z } from "zod";

import { AVAILABILITY_DAYS } from "./mentorship.profile.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const availabilitySlotSchema = z
  .object({
    day: z.enum(AVAILABILITY_DAYS),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "startTime must be in HH:mm format"),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "endTime must be in HH:mm format"),

    timezone: z.string().trim().min(1).max(60),
  })
  .strict();

export const createMentorshipProfileValidation = z.object({
  body: z
    .object({
      mentor: mongoObjectIdSchema,

      bio: z.string().trim().min(10).max(3000),

      expertise: z.array(z.string().trim().min(1).max(100)).max(30).optional(),

      availability: z.array(availabilitySlotSchema).max(14).optional(),

      profileImage: z.string().trim().url().optional(),

      isPrimaryMentor: z.boolean().optional(),

      yearsOfExperience: z.number().int().min(0).max(80).optional(),

      sessionDurationMinutes: z.number().int().min(15).max(180).optional(),

      order: z.number().int().min(0).optional(),
    })
    .strict(),
});

export const updateMentorshipProfileValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      bio: z.string().trim().min(10).max(3000).optional(),

      expertise: z.array(z.string().trim().min(1).max(100)).max(30).optional(),

      availability: z.array(availabilitySlotSchema).max(14).optional(),

      profileImage: z.string().trim().url().nullable().optional(),

      isPrimaryMentor: z.boolean().optional(),
      isActive: z.boolean().optional(),

      yearsOfExperience: z.number().int().min(0).max(80).optional(),

      sessionDurationMinutes: z.number().int().min(15).max(180).optional(),

      order: z.number().int().min(0).optional(),
    })
    .strict(),
});

export const mentorshipProfileIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const selectCoMentorValidation = z.object({
  body: z
    .object({
      mentorshipProfileId: mongoObjectIdSchema,
    })
    .strict(),
});