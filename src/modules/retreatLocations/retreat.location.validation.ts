// server/src/modules/retreatLocations/retreat.location.validation.ts
import { z } from "zod";
import { RETREAT_LOCATION_STATUSES } from "./retreat.location.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

/** multipart sends "true"/"false" strings */
const booleanFromMultipart = z.preprocess((val) => {
  if (val === true || val === "true") return true;
  if (val === false || val === "false") return false;
  return val;
}, z.boolean());

/** multipart may send a single string or JSON array string for whatsIncluded */
const stringArrayFromMultipart = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // comma-separated fallback
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return val;
}, z.array(z.string().trim().min(1).max(300)).max(30).optional());

const orderFromMultipart = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }
  return val;

}, z.number().int().min(0).optional());

/**
 * coverImage / galleryImages are optional URL strings in the body.
 * Actual files come via multer (coverImage, gallery) and are uploaded
 * in the controller — so we do NOT require them here.
 */
export const createRetreatLocationValidation = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      slug: z.string().trim().min(2).max(200).optional(),
      country: z.string().trim().min(2).max(100),
      city: z.string().trim().min(2).max(100),

      tagline: z.string().trim().max(300).optional(),
      description: z.string().trim().min(10).max(5000),

      // Optional: only if client still sends a URL (e.g. keep existing)
      coverImage: z.string().trim().url().optional(),
      promoVideoUrl: z.preprocess((val) => {
        if (val === "null" || val === null) return null;
        return val;
      }, z.string().trim().url().nullable().optional()),
      // Optional existing gallery URLs as JSON array string
      galleryImages: z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      }, z.array(z.string().trim().url()).max(20).optional()),

      whatsIncluded: stringArrayFromMultipart,

      isFeatured: booleanFromMultipart.optional(),
      isActive: booleanFromMultipart.optional(),
      status: z.enum(RETREAT_LOCATION_STATUSES).optional(),
      order: orderFromMultipart,
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

      // null / "null" = clear cover
      coverImage: z.preprocess((val) => {
        if (val === "null" || val === null) return null;
        return val;
      }, z.string().trim().url().nullable().optional()),

      promoVideoUrl: z.preprocess((val) => {
        if (val === "null" || val === null) return null;
        return val;
      }, z.string().trim().url().nullable().optional()),

      galleryImages: z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      }, z.array(z.string().trim().url()).max(20).optional()),

      whatsIncluded: stringArrayFromMultipart,

      isFeatured: booleanFromMultipart.optional(),
      isActive: booleanFromMultipart.optional(),
      status: z.enum(RETREAT_LOCATION_STATUSES).optional(),
      order: orderFromMultipart,

      /** set to "true" to replace gallery entirely with uploaded files only */
      replaceGallery: booleanFromMultipart.optional(),
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