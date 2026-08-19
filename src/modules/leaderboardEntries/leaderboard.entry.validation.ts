import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const leaderboardIdParamValidation = z.object({
  params: z.object({
    leaderboardId: mongoObjectIdSchema,
  }),
});

export const leaderboardUserParamValidation = z.object({
  params: z.object({
    leaderboardId: mongoObjectIdSchema,
    userId: mongoObjectIdSchema,
  }),
});

export const upsertLeaderboardPointsValidation = z.object({
  params: z.object({
    leaderboardId: mongoObjectIdSchema,
  }),

  body: z.object({
    userId: mongoObjectIdSchema,

    pointsDelta: z.number().int(),

    breakdownKey: z.string().trim().min(1).max(64).optional(),
  }),
});

export const getLeaderboardEntriesValidation = z.object({
  params: z.object({
    leaderboardId: mongoObjectIdSchema,
  }),

  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
});
