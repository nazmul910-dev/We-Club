import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const issueCertificateValidation = z.object({
  params: z.object({
    pillarId: mongoObjectIdSchema,
  }),
});

export const certificateIdValidation = z.object({
  params: z.object({
    certificateId: mongoObjectIdSchema,
  }),
});

export const adminCertificateIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const verifyCertificateValidation = z.object({
  params: z.object({
    certificateNumber: z.string().trim().min(5).max(60),
  }),
});

export const attachCertificateUrlValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      certificateUrl: z.string().trim().url(),
    })
    .strict(),
});

export const revokeCertificateValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      reason: z.string().trim().max(500).optional(),
    })
    .strict(),
});

export const getAllCertificatesValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),
    moduleId: mongoObjectIdSchema.optional(),
    pillarId: mongoObjectIdSchema.optional(),

    status: z.enum(["issued", "revoked"]).optional(),

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
