import { z } from "zod";

import {
  CLOUDINARY_RESOURCE_TYPES,
  MODULE_RESOURCE_PROVIDERS,
  MODULE_RESOURCE_TYPES,
} from "./module.resource.interface";

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

const createModuleResourceBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    slug: slugSchema,
    description: z.string().trim().max(3000).optional(),

    resourceType: z.enum(MODULE_RESOURCE_TYPES),
    provider: z.enum(MODULE_RESOURCE_PROVIDERS),
    externalUrl: z.string().url().optional(),

    isRequired: z.boolean().default(true),
    pointsReward: z.number().int().nonnegative().default(5),
    order: z.number().int().min(1),
  })
  .superRefine((data, context) => {
    if (data.provider === "external" && !data.externalUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["externalUrl"],
        message: "External resource requires externalUrl",
      });
    }

    if (data.provider === "cloudinary" && data.externalUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["externalUrl"],
        message: "Cloudinary resource cannot have externalUrl",
      });
    }
  });

const updateModuleResourceBodySchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(3000).nullable().optional(),

    resourceType: z.enum(MODULE_RESOURCE_TYPES).optional(),
    provider: z.enum(MODULE_RESOURCE_PROVIDERS).optional(),

    fileName: z.string().trim().min(1).nullable().optional(),
    mimeType: z.string().trim().min(1).nullable().optional(),
    format: z.string().trim().min(1).nullable().optional(),
    bytes: z.number().int().nonnegative().nullable().optional(),

    cloudinaryPublicId: z.string().trim().min(1).nullable().optional(),
    cloudinaryAssetId: z.string().trim().min(1).nullable().optional(),
    cloudinaryResourceType: z
      .enum(CLOUDINARY_RESOURCE_TYPES)
      .nullable()
      .optional(),
    secureUrl: z.string().url().nullable().optional(),
    externalUrl: z.string().url().nullable().optional(),
    thumbnailUrl: z.string().url().nullable().optional(),

    isRequired: z.boolean().optional(),
    pointsReward: z.number().int().nonnegative().optional(),
    order: z.number().int().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createModuleResourceValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
  body: createModuleResourceBodySchema,
});

export const updateModuleResourceValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
  body: updateModuleResourceBodySchema,
});

export const moduleResourceIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const moduleResourceModuleValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
});
