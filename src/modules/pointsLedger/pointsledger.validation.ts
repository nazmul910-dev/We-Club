import { z } from "zod";

import {
  POINTS_LEDGER_REASONS,
  POINTS_LEDGER_SOURCE_TYPES,
  POINTS_LEDGER_TYPES,
} from "./pointsledger.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const pointsLedgerIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const createPointsLedgerValidation = z.object({
  body: z.object({
    user: mongoObjectIdSchema,
    sourceType: z.enum(POINTS_LEDGER_SOURCE_TYPES).optional(),
    sourceId: mongoObjectIdSchema.optional(),
    sourceEntity: z.string().trim().max(120).optional(),
    points: z.number().int().min(-1000000).max(1000000),
    transactionType: z.enum(POINTS_LEDGER_TYPES),
    reason: z.enum(POINTS_LEDGER_REASONS),
    description: z.string().trim().max(500).optional(),
    balanceAfter: z.number().int().min(-1000000).max(1000000).optional(),
    balanceBefore: z.number().int().min(-1000000).max(1000000).optional(),
    module: mongoObjectIdSchema.optional(),
    video: mongoObjectIdSchema.optional(),
    action: mongoObjectIdSchema.optional(),
    quiz: mongoObjectIdSchema.optional(),
    session: mongoObjectIdSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const getPointsLedgerValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),
    sourceType: z.enum(POINTS_LEDGER_SOURCE_TYPES).optional(),
    sourceEntity: z.string().trim().max(120).optional(),
    reason: z.enum(POINTS_LEDGER_REASONS).optional(),
    transactionType: z.enum(POINTS_LEDGER_TYPES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
