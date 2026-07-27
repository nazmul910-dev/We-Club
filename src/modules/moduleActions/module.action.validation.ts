import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

const createModuleActionBodySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(2)
      .max(300),

    description: z
      .string()
      .trim()
      .max(5000)
      .optional(),

    order: z
      .number()
      .int()
      .min(1),

    isRequired: z
      .boolean()
      .default(true),

    pointsReward: z
      .number()
      .int()
      .nonnegative()
      .max(1000)
      .default(5),
  });

const updateModuleActionBodySchema =
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2)
        .max(300)
        .optional(),

      description: z
        .string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),

      order: z
        .number()
        .int()
        .min(1)
        .optional(),

      isRequired: z
        .boolean()
        .optional(),

      pointsReward: z
        .number()
        .int()
        .nonnegative()
        .max(1000)
        .optional(),
    })
    .refine(
      (body) =>
        Object.keys(body).length > 0,
      {
        message:
          "At least one field is required",
      }
    );

export const createModuleActionValidation =
  z.object({
    params: z.object({
      moduleId: mongoObjectIdSchema,
    }),

    body: createModuleActionBodySchema,
  });

export const updateModuleActionValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),

    body: updateModuleActionBodySchema,
  });

export const moduleActionIdValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),
  });

export const moduleActionModuleValidation =
  z.object({
    params: z.object({
      moduleId: mongoObjectIdSchema,
    }),
  });