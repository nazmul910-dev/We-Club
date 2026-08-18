import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");


const parseJsonString = (val: unknown): unknown => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};


const parseBooleanString = (val: unknown): unknown => {
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
};

/** Accept numeric strings as numbers */
const parseNumberString = (val: unknown): unknown => {
  if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) {
    return Number(val);
  }
  return val;
};


const venueDetailsValidation = z.object({
  venueName: z.string().trim().max(200).optional(),
  capacity: z.preprocess(parseNumberString, z.number().int().min(1).optional()),
  accommodationType: z.string().trim().max(100).optional(),
  venueType: z.string().trim().max(100).optional(),
  contactEmail: z.string().trim().email().optional(),
  features: z.array(z.string().trim().max(100)).optional(),
});

const coordinatesValidation = z.object({
  lat: z.preprocess(parseNumberString, z.number().min(-90).max(90)),
  lng: z.preprocess(parseNumberString, z.number().min(-180).max(180)),
});


export const createRetreatLocationValidation = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    country: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    stateOrProvince: z.string().trim().max(100).optional(),
    address: z.string().trim().max(300).optional(),
    description: z.string().trim().min(10).max(5000),
    shortDescription: z.string().trim().max(500).optional(),
    venueDetails: z.preprocess(parseJsonString, venueDetailsValidation.optional()),
    coordinates: z.preprocess(parseJsonString, coordinatesValidation.optional()),
    amenities: z.preprocess(
      parseJsonString,
      z.array(z.string().trim().max(100)).max(50).optional(),
    ),
    coverImage: z.string().trim().url("coverImage must be a valid URL").optional(),
    gallery: z.preprocess(
      parseJsonString,
      z.array(z.string().trim()).max(30).optional(),
    ),
    featured: z.preprocess(parseBooleanString, z.boolean().optional()),
    isActive: z.preprocess(parseBooleanString, z.boolean().optional()),
    order: z.preprocess(parseNumberString, z.number().int().min(0).optional()),
  }),
});

export const updateRetreatLocationValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
  body: z.object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    country: z.string().trim().min(2).max(100).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    stateOrProvince: z.string().trim().max(100).optional(),
    address: z.string().trim().max(300).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    shortDescription: z.string().trim().max(500).optional(),
    venueDetails: z.preprocess(parseJsonString, venueDetailsValidation.nullable().optional()),
    coordinates: z.preprocess(parseJsonString, coordinatesValidation.nullable().optional()),
    amenities: z.preprocess(
      parseJsonString,
      z.array(z.string().trim().max(100)).max(50).optional(),
    ),
    coverImage: z.string().trim().url().optional(),
    gallery: z.preprocess(
      parseJsonString,
      z.array(z.string().trim()).max(30).optional(),
    ),
    featured: z.preprocess(parseBooleanString, z.boolean().optional()),
    isActive: z.preprocess(parseBooleanString, z.boolean().optional()),
    order: z.preprocess(parseNumberString, z.number().int().min(0).optional()),
  }),
});

export const retreatLocationIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const retreatLocationSlugValidation = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  }),
});
