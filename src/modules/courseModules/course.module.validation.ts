import { z } from 'zod';

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    'Invalid MongoDB ObjectId'
  );

const moduleSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug may contain lowercase letters, numbers and hyphens only'
  );

const createCourseModuleBodySchema =
  z.object({
    pillar: mongoObjectIdSchema,

    title: z
      .string()
      .trim()
      .min(2)
      .max(200),

    slug: moduleSlugSchema,

    shortDescription: z
      .string()
      .trim()
      .max(500)
      .optional(),

    description: z
      .string()
      .trim()
      .min(10)
      .max(5000),

    thumbnailUrl: z
      .string()
      .url()
      .optional(),

    moduleNumber: z
      .number()
      .int()
      .min(1),

    estimatedDurationMinutes: z
      .number()
      .int()
      .nonnegative()
      .default(0),

    minimumVideoPercent: z
      .number()
      .min(1)
      .max(100)
      .default(80),

    minimumActionPercent: z
      .number()
      .min(1)
      .max(100)
      .default(80),

    minimumQuizScore: z
      .number()
      .min(1)
      .max(100)
      .default(70),

    maximumQuizAttempts: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(2),

    completionPoints: z
      .number()
      .int()
      .nonnegative()
      .default(20),
  });

const updateCourseModuleBodySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .optional(),

    slug: moduleSlugSchema.optional(),

    shortDescription: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),

    description: z
      .string()
      .trim()
      .min(10)
      .max(5000)
      .optional(),

    thumbnailUrl: z
      .string()
      .url()
      .nullable()
      .optional(),

    moduleNumber: z
      .number()
      .int()
      .min(1)
      .optional(),

    estimatedDurationMinutes: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    minimumVideoPercent: z
      .number()
      .min(1)
      .max(100)
      .optional(),

    minimumActionPercent: z
      .number()
      .min(1)
      .max(100)
      .optional(),

    minimumQuizScore: z
      .number()
      .min(1)
      .max(100)
      .optional(),

    maximumQuizAttempts: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional(),

    completionPoints: z
      .number()
      .int()
      .nonnegative()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        'At least one field is required',
    }
  );

export const createCourseModuleValidation =
  z.object({
    body: createCourseModuleBodySchema,
  });

export const updateCourseModuleValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),

    body: updateCourseModuleBodySchema,
  });

export const courseModuleIdValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),
  });

export const courseModulePillarValidation =
  z.object({
    params: z.object({
      pillarId: mongoObjectIdSchema,
    }),
  });