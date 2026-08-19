import { z } from "zod";

import { RETREAT_LOCATION_STATUSES } from "./retreat.location.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createRetreatLocationValidation = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      slug: z.string().trim().min(2).max(200).optional(),
      country: z.string().trim().min(2).max(100),
      city: z.string().trim().min(2).max(100),

      tagline: z.string().trim().max(300).optional(),
      description: z.string().trim().min(10).max(5000),

      coverImage: z.string().trim().url().optional(),
      promoVideoUrl: z.string().trim().url().optional(),
      galleryImages: z.array(z.string().trim().url()).max(20).optional(),
      whatsIncluded: z.array(z.string().trim().min(1).max(300)).max(30).optional(),

      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),
      status: z.enum(RETREAT_LOCATION_STATUSES).optional(),
      order: z.number().int().min(0).optional(),
    })
    .strict(),
});

export const updateRetreatLocationValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      slug: z.string().trim().min(2).max(200).optional(),
      country: z.string().trim().min(2).max(100).optional(),
      city: z.string().trim().min(2).max(100).optional(),

      tagline: z.string().trim().max(300).optional(),
      description: z.string().trim().min(10).max(5000).optional(),

      coverImage: z.string().trim().url().nullable().optional(),
      promoVideoUrl: z.string().trim().url().nullable().optional(),
      galleryImages: z.array(z.string().trim().url()).max(20).optional(),
      whatsIncluded: z.array(z.string().trim().min(1).max(300)).max(30).optional(),

      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),
      status: z.enum(RETREAT_LOCATION_STATUSES).optional(),
      order: z.number().int().min(0).optional(),
    })
    .strict(),
});

export const retreatLocationIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const queryRetreatLocationValidation = z.object({
  query: z
    .object({
      status: z.enum(RETREAT_LOCATION_STATUSES).optional(),
      isActive: z.coerce.boolean().optional(),
      isFeatured: z.coerce.boolean().optional(),
      search: z.string().trim().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional(),
});
