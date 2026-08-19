import { z } from "zod";

import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_STATUSES,
  LEADERBOARD_TYPES,
} from "./leaderboard.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const leaderboardIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const createLeaderboardValidation = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),

    type: z.enum(LEADERBOARD_TYPES),
    period: z.enum(LEADERBOARD_PERIODS),

    startAt: z.coerce.date(),
    endAt: z.coerce.date(),

    description: z.string().trim().max(1000).optional(),
  }),
});

export const updateLeaderboardValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      title: z.string().trim().min(3).max(150).optional(),
      description: z.string().trim().max(1000).optional(),

      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

export const getAllLeaderboardsValidation = z.object({
  query: z.object({
    type: z.enum(LEADERBOARD_TYPES).optional(),
    period: z.enum(LEADERBOARD_PERIODS).optional(),
    status: z.enum(LEADERBOARD_STATUSES).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
