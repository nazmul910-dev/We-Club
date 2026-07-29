import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const moduleProgressModuleIdValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
});

export const adminModuleProgressValidation = z.object({
  params: z.object({
    userId: mongoObjectIdSchema,
    moduleId: mongoObjectIdSchema,
  }),
});

export const getAllModuleProgressValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),

    moduleId: mongoObjectIdSchema.optional(),

    isCompleted: z.enum(["true", "false"]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
