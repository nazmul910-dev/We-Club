import { z } from "zod";

import {
  ENTITLEMENT_LOG_ACTIONS,
  ENTITLEMENT_LOG_SOURCES,
} from "./entitlementlog.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const createEntitlementLogBodySchema = z.object({
  user: mongoObjectIdSchema,

  entitlement: mongoObjectIdSchema,

  pillar: mongoObjectIdSchema.optional(),

  paymentSession: mongoObjectIdSchema.optional(),

  action: z.enum(ENTITLEMENT_LOG_ACTIONS),

  source: z.enum(ENTITLEMENT_LOG_SOURCES),

  reason: z.string().trim().max(1000).optional(),

  actor: mongoObjectIdSchema.optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createEntitlementLogValidation = z.object({
  body: createEntitlementLogBodySchema,
});

export const entitlementLogIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const getAllEntitlementLogsValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),

    entitlementId: mongoObjectIdSchema.optional(),

    pillarId: mongoObjectIdSchema.optional(),

    action: z.enum(ENTITLEMENT_LOG_ACTIONS).optional(),

    source: z.enum(ENTITLEMENT_LOG_SOURCES).optional(),

    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});