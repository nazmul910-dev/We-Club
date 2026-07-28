import { z } from "zod";

import {
  INTRO_VIDEO_STATUSES,
  PILLAR_ICONS,
  PILLAR_NAMES,
  PILLAR_SLUGS,
} from "./challenge.pillar.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const accentColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Accent color must be a valid HEX color");

const introVideoSchema = z.object({
  cloudinaryPublicId: z.string().trim().min(1).optional(),

  cloudinaryAssetId: z.string().trim().min(1).optional(),

  secureUrl: z.string().url().optional(),

  playbackUrl: z.string().url().optional(),

  thumbnailUrl: z.string().url().optional(),

  durationSeconds: z.number().nonnegative().optional(),

  format: z.string().trim().optional(),

  bytes: z.number().int().nonnegative().optional(),

  status: z.enum(INTRO_VIDEO_STATUSES).optional(),
});

const createChallengePillarBodySchema = z
  .object({
    name: z.enum(PILLAR_NAMES),

    slug: z.enum(PILLAR_SLUGS),

    title: z.string().trim().min(2).max(150),

    tagline: z.string().trim().min(2).max(250),

    description: z.string().trim().min(10).max(3000),

    icon: z.enum(PILLAR_ICONS),

    accentColor: accentColorSchema.default("#C9A84C"),

    isPaid: z.boolean().default(false),

    priceCents: z.number().int().nonnegative().default(0),

    currency: z.literal("usd").default("usd"),

    stripePriceId: z.string().trim().min(3).optional(),

    introVideo: introVideoSchema.optional(),

    order: z.number().int().min(1).max(3),
  })
  .superRefine((data, context) => {
    const pillarRules = {
      fearless: {
        name: "FEARLESS",
        icon: "crown",
        order: 1,
      },

      limitless: {
        name: "LIMITLESS",
        icon: "infinity",
        order: 2,
      },

      borderless: {
        name: "BORDERLESS",
        icon: "globe",
        order: 3,
      },
    } as const;

    const expected = pillarRules[data.slug];

    if (data.name !== expected.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: `${data.slug} name must be ${expected.name}`,
      });
    }

    if (data.icon !== expected.icon) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icon"],
        message: `${data.slug} icon must be ${expected.icon}`,
      });
    }

    if (data.order !== expected.order) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["order"],
        message: `${data.slug} order must be ${expected.order}`,
      });
    }

    if (data.isPaid && data.priceCents <= 0 && !data.stripePriceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceCents"],
        message: "Paid pillar requires priceCents or stripePriceId",
      });
    }

    if (!data.isPaid && data.priceCents > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceCents"],
        message: "Free pillar price must be zero",
      });
    }

    if (!data.isPaid && data.stripePriceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stripePriceId"],
        message: "Free pillar cannot have Stripe Price ID",
      });
    }
  });

const updateChallengePillarBodySchema = z
  .object({
    title: z.string().trim().min(2).max(150).optional(),

    tagline: z.string().trim().min(2).max(250).optional(),

    description: z.string().trim().min(10).max(3000).optional(),

    accentColor: accentColorSchema.optional(),

    isPaid: z.boolean().optional(),

    priceCents: z.number().int().nonnegative().optional(),

    currency: z.literal("usd").optional(),

    stripePriceId: z.string().trim().min(3).nullable().optional(),

    introVideo: introVideoSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createChallengePillarValidation = z.object({
  body: createChallengePillarBodySchema,
});

export const updateChallengePillarValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: updateChallengePillarBodySchema,
});

export const challengePillarIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const challengePillarSlugValidation = z.object({
  params: z.object({
    slug: z.enum(PILLAR_SLUGS),
  }),
});
