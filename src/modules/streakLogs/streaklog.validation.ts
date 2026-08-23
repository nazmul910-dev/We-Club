import { z } from "zod";

import { STREAK_ACTIVITY_TYPES, STREAK_TIMEZONES } from "./streaklog.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const dateStringSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.string().datetime({ offset: true }),
  ])
  .or(z.date());

export const streakLogIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const createStreakLogValidation = z.object({
  body: z.object({
    user: mongoObjectIdSchema,
    academyProfile: mongoObjectIdSchema.optional(),
    activityDate: dateStringSchema,
    timezone: z.enum(STREAK_TIMEZONES).optional(),
    activityType: z.enum(STREAK_ACTIVITY_TYPES).optional(),
    activityCount: z.number().int().min(1).max(100).optional(),
  }),
});

export const getStreakLogsValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),
    academyProfileId: mongoObjectIdSchema.optional(),
    timezone: z.enum(STREAK_TIMEZONES).optional(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
