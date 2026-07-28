import { z } from "zod";

import {
  ADMIN_ENTITLEMENT_SOURCES,
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  ENTITLEMENT_TYPES,
} from "./userEntitlements.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const optionalDateSchema = z
  .string()
  .datetime({
    message: "Date must be a valid ISO datetime",
  })
  .optional();

const nullableDateSchema = z
  .string()
  .datetime({
    message: "Date must be a valid ISO datetime",
  })
  .nullable()
  .optional();

const validateEntitlementTarget = (
  data: {
    entitlementType?: string | undefined;
    pillar?: string | undefined;
    targetId?: string | undefined;
  },
  context: z.RefinementCtx,
): void => {
  const type = data.entitlementType ?? "pillar";

  if (type === "pillar") {
    if (!data.pillar) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pillar"],
        message: "Pillar is required for pillar entitlement",
      });
    }

    if (data.targetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetId"],
        message: "targetId is not allowed for pillar entitlement",
      });
    }

    return;
  }

  if (!data.targetId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetId"],
      message: "targetId is required for bundle, event or retreat entitlement",
    });
  }

  if (data.pillar) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pillar"],
      message: "Pillar is only allowed for pillar entitlement",
    });
  }
};

const validateDates = (
  data: {
    startsAt?: string | undefined;

    expiresAt?: string | null | undefined;
  },
  context: z.RefinementCtx,
): void => {
  if (!data.expiresAt) {
    return;
  }

  const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();

  const expiresAt = new Date(data.expiresAt);

  if (expiresAt <= startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "expiresAt must be later than startsAt",
    });
  }
};

const grantEntitlementBodySchema = z
  .object({
    user: mongoObjectIdSchema,

    entitlementType: z.enum(ENTITLEMENT_TYPES).default("pillar"),

    pillar: mongoObjectIdSchema.optional(),

    targetId: mongoObjectIdSchema.optional(),

    source: z.enum(ADMIN_ENTITLEMENT_SOURCES).default("admin"),

    paymentSession: mongoObjectIdSchema.optional(),

    startsAt: optionalDateSchema,

    expiresAt: nullableDateSchema,
  })
  .superRefine((data, context) => {
    validateEntitlementTarget(data, context);

    validateDates(data, context);
  });

const reactivateBodySchema = z
  .object({
    source: z.enum(ADMIN_ENTITLEMENT_SOURCES).default("admin"),

    startsAt: optionalDateSchema,

    expiresAt: nullableDateSchema,
  })
  .superRefine((data, context) => {
    validateDates(data, context);
  });

const statusReasonBodySchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const grantUserEntitlementValidation = z.object({
  body: grantEntitlementBodySchema,
});

export const entitlementIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const pillarAccessValidation = z.object({
  params: z.object({
    pillarId: mongoObjectIdSchema,
  }),
});

export const entitlementStatusValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: statusReasonBodySchema,
});

export const reactivateEntitlementValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: reactivateBodySchema,
});

export const getAllEntitlementsValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),

    pillarId: mongoObjectIdSchema.optional(),

    entitlementType: z.enum(ENTITLEMENT_TYPES).optional(),

    source: z.enum(ENTITLEMENT_SOURCES).optional(),

    status: z.enum(ENTITLEMENT_STATUSES).optional(),

    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
