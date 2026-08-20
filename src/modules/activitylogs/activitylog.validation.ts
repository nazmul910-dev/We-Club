import { z } from "zod";

import {
  ACTIVITY_LOG_ACTIONS,
  ACTIVITY_LOG_ENTITY_TYPES,
} from "./activitylog.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const createActivityLogBodySchema = z.object({
  actor: mongoObjectIdSchema.optional(),

  action: z.enum(ACTIVITY_LOG_ACTIONS),

  targetEntityType: z.enum(ACTIVITY_LOG_ENTITY_TYPES),

  targetEntityId: mongoObjectIdSchema.optional(),

  changeSummary: z.string().trim().max(1000).optional(),

  changes: z.record(z.string(), z.unknown()).optional(),

  ipAddress: z.string().trim().optional(),

  userAgent: z.string().trim().optional(),
});

export const createActivityLogValidation = z.object({
  body: createActivityLogBodySchema,
});

export const activityLogIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const getAllActivityLogsValidation = z.object({
  query: z.object({
    actorId: mongoObjectIdSchema.optional(),

    action: z.enum(ACTIVITY_LOG_ACTIONS).optional(),

    targetEntityType: z.enum(ACTIVITY_LOG_ENTITY_TYPES).optional(),

    targetEntityId: mongoObjectIdSchema.optional(),

    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});