import { z } from "zod";

import { SESSION_ATTENDANCE_STATUSES } from "./sessionattendances.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const registerSessionAttendanceValidation = z.object({
  body: z.object({
    session: mongoObjectIdSchema,
    user: mongoObjectIdSchema.optional(),
  }),
});

export const markSessionAttendanceValidation = z.object({
  body: z.object({
    session: mongoObjectIdSchema,
    user: mongoObjectIdSchema,

    status: z.enum(SESSION_ATTENDANCE_STATUSES),

    notes: z.string().trim().max(1000).optional(),
  }),
});

export const cancelSessionAttendanceValidation = z.object({
  body: z.object({
    session: mongoObjectIdSchema,
    user: mongoObjectIdSchema.optional(),

    reason: z.string().trim().max(1000).optional(),
  }),
});

export const sessionAttendanceIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const getAllSessionAttendancesValidation = z.object({
  query: z.object({
    sessionId: mongoObjectIdSchema.optional(),
    userId: mongoObjectIdSchema.optional(),

    status: z.enum(SESSION_ATTENDANCE_STATUSES).optional(),

    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});