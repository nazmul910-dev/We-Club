import { z } from "zod";

import { SESSION_STATUSES, SESSION_TYPES } from "./sessionschedules.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date/time",
  });

const createSessionScheduleBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),

    description: z.string().trim().max(2000).optional(),

    sessionType: z.enum(SESSION_TYPES),

    host: mongoObjectIdSchema,

    pillar: mongoObjectIdSchema.optional(),
    courseModule: mongoObjectIdSchema.optional(),

    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    timezone: z.string().trim().min(1),

    meetingUrl: z.string().trim().url().optional(),

    capacity: z.coerce.number().int().min(1).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const createSessionScheduleValidation = z.object({
  body: createSessionScheduleBodySchema,
});

const updateSessionScheduleBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),

    description: z.string().trim().max(2000).optional(),

    sessionType: z.enum(SESSION_TYPES).optional(),

    host: mongoObjectIdSchema.optional(),

    pillar: mongoObjectIdSchema.nullable().optional(),
    courseModule: mongoObjectIdSchema.nullable().optional(),

    startTime: isoDateTimeSchema.optional(),
    endTime: isoDateTimeSchema.optional(),
    timezone: z.string().trim().min(1).optional(),

    meetingUrl: z.string().trim().url().nullable().optional(),

    capacity: z.coerce.number().int().min(1).nullable().optional(),

    status: z.enum(SESSION_STATUSES).optional(),
  })
  .refine(
    (data) =>
      !(data.startTime && data.endTime) ||
      new Date(data.endTime) > new Date(data.startTime),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export const updateSessionScheduleValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: updateSessionScheduleBodySchema,
});

export const sessionScheduleIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const cancelSessionScheduleValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z.object({
    reason: z.string().trim().min(1).max(1000),
  }),
});

export const getAllSessionSchedulesValidation = z.object({
  query: z.object({
    hostId: mongoObjectIdSchema.optional(),
    pillarId: mongoObjectIdSchema.optional(),
    courseModuleId: mongoObjectIdSchema.optional(),

    sessionType: z.enum(SESSION_TYPES).optional(),
    status: z.enum(SESSION_STATUSES).optional(),

    startDate: isoDateTimeSchema.optional(),
    endDate: isoDateTimeSchema.optional(),

    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});