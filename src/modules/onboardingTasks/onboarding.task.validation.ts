import { z } from "zod";

import { ONBOARDING_TASK_TRIGGERS } from "./onboarding.task.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const createOnboardingTaskBodySchema = z.object({
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(2000).optional(),
  order: z.number().int().min(1),
  trigger: z.enum(ONBOARDING_TASK_TRIGGERS).default("manual"),
  actionLabel: z.string().trim().max(60).optional(),
  actionUrl: z.string().trim().max(500).optional(),
  linkedVideo: mongoObjectIdSchema.optional(),
  pointsReward: z.number().int().nonnegative().max(1000).default(5),
});

export const createOnboardingTaskValidation = z.object({
  body: createOnboardingTaskBodySchema,
});

export const updateOnboardingTaskValidation = z.object({
  params: z.object({ id: mongoObjectIdSchema }),
  body: createOnboardingTaskBodySchema.partial(),
});

export const onboardingTaskIdValidation = z.object({
  params: z.object({ id: mongoObjectIdSchema }),
});