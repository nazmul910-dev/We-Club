import { z } from "zod";

import { VIDEO_UPLOAD_STATUSES } from "./module.video.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may contain lowercase letters, numbers and hyphens only"
  );

const createModuleVideoBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z.string().trim().max(3000).optional(),

  isPaid: z.boolean().default(false),

  isRequired: z.boolean().default(true),
  requiredWatchPercent: z.number().min(1).max(100).default(80),
  pointsReward: z.number().int().nonnegative().default(10),
  order: z.number().int().min(1),
});

const updateModuleVideoBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(3000).nullable().optional(),

    isPaid: z.boolean().optional(),
    
    cloudinaryPublicId: z.string().trim().min(1).optional(),
    cloudinaryAssetId: z.string().trim().min(1).nullable().optional(),

    secureUrl: z.string().url().optional(),
    playbackUrl: z.string().url().nullable().optional(),
    thumbnailUrl: z.string().url().nullable().optional(),
    folder: z.string().trim().min(1).nullable().optional(),

    format: z.string().trim().min(1).nullable().optional(),
    durationSeconds: z.number().nonnegative().optional(),
    bytes: z.number().int().nonnegative().nullable().optional(),
    width: z.number().int().nonnegative().nullable().optional(),
    height: z.number().int().nonnegative().nullable().optional(),

    isRequired: z.boolean().optional(),
    requiredWatchPercent: z.number().min(1).max(100).optional(),
    pointsReward: z.number().int().nonnegative().optional(),
    order: z.number().int().min(1).optional(),

    uploadStatus: z.enum(VIDEO_UPLOAD_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createModuleVideoValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
  body: createModuleVideoBodySchema,
});

export const updateModuleVideoValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
  body: updateModuleVideoBodySchema,
});

export const moduleVideoIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const moduleVideoModuleValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
});
