import { QueryFilter, Types } from "mongoose";

import { ChallengePillar } from "../challengePillars/challenge.pillar.model.schema";

import { User } from "../users/users.model.schema";

import {
  EntitlementSource,
  IActivatePillarFromPaymentInput,
  IEntitlementStatusInput,
  IGetEntitlementsOptions,
  IGrantUserEntitlementInput,
  IReactivateEntitlementInput,
  IUserEntitlement,
} from "./userEntitlements.interface";

import { UserEntitlement } from "./userEntitlements.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const parseOptionalDate = (value?: string | undefined): Date => {
  return value ? new Date(value) : new Date();
};

const parseNullableDate = (
  value?: string | null | undefined,
): Date | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
};

const buildEntitlementKey = ({
  entitlementType,
  pillarId,
  targetId,
}: {
  entitlementType: "pillar" | "bundle" | "event" | "retreat";

  pillarId?: string | undefined;
  targetId?: string | undefined;
}): string => {
  if (entitlementType === "pillar") {
    if (!pillarId) {
      throwServiceError("Pillar ID is required", 400);
    }

    return `pillar:${pillarId}`;
  }

  if (!targetId) {
    throwServiceError("Target ID is required", 400);
  }

  return `${entitlementType}:${targetId}`;
};

const validateDateRange = (
  startsAt: Date,
  expiresAt?: Date | undefined,
): void => {
  if (expiresAt && expiresAt <= startsAt) {
    throwServiceError("expiresAt must be later than startsAt", 400);
  }
};

const populateEntitlement = (entitlementId: Types.ObjectId | string) => {
  return UserEntitlement.findById(entitlementId)
    .populate("user", "fullName email role accessTo profileImage accountStatus")
    .populate("pillar", "name slug title isPaid priceCents currency status")
    .populate(
      "paymentSession",
      "purpose status stripeCheckoutSessionId amountTotal currency",
    )
    .populate("grantedBy", "fullName email role profileImage")
    .populate("statusChangedBy", "fullName email role profileImage");
};

const expirePastEntitlements = async (
  userId?: string | undefined,
): Promise<void> => {
  const now = new Date();

  const filter: QueryFilter<IUserEntitlement> = {
    status: "active",

    expiresAt: {
      $lte: now,
    },
  };

  if (userId) {
    filter.user = new Types.ObjectId(userId);
  }

  await UserEntitlement.updateMany(filter, {
    $set: {
      status: "expired",
      expiredAt: now,
    },
  });
};

const ensureUserExists = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const user = await User.findById(userId).select(
    "_id fullName email role accessTo accountStatus",
  );

  assertFound(user, "User not found", 404);

  return user;
};

const ensurePillarExists = async (pillarId: string) => {
  assertValidObjectId(pillarId, "Pillar ID");

  const pillar = await ChallengePillar.findById(pillarId);

  assertFound(pillar, "Challenge pillar not found", 404);

  if (pillar.status === "archived") {
    throwServiceError("Cannot grant access to an archived pillar", 400);
  }

  return pillar;
};

type InternalGrantInput = {
  userId: string;

  entitlementType: "pillar" | "bundle" | "event" | "retreat";

  pillarId?: string | undefined;
  targetId?: string | undefined;

  source: EntitlementSource;

  paymentSessionId?: string | undefined;

  startsAt: Date;
  expiresAt?: Date | undefined;

  grantedBy?: string | undefined;
};

const grantEntitlementInternal = async (input: InternalGrantInput) => {
  await ensureUserExists(input.userId);

  if (input.entitlementType === "pillar") {
    if (!input.pillarId) {
      throwServiceError("Pillar ID is required", 400);
    }

    await ensurePillarExists(input.pillarId as string);
  } else {
    if (!input.targetId) {
      throwServiceError("Target ID is required", 400);
    }

    assertValidObjectId(input.targetId as string, "Target ID");
  }

  if (input.paymentSessionId) {
    assertValidObjectId(input.paymentSessionId, "Payment session ID");
  }

  if (input.grantedBy) {
    assertValidObjectId(input.grantedBy, "Granted by user ID");
  }

  validateDateRange(input.startsAt, input.expiresAt);

  const entitlementKey = buildEntitlementKey({
    entitlementType: input.entitlementType,

    pillarId: input.pillarId,
    targetId: input.targetId,
  });

  const existingEntitlement = await UserEntitlement.findOne({
    user: new Types.ObjectId(input.userId),

    entitlementKey,
  });

  if (existingEntitlement) {
    existingEntitlement.entitlementType = input.entitlementType;

    existingEntitlement.entitlementKey = entitlementKey;

    existingEntitlement.source = input.source;

    existingEntitlement.status = "active";

    existingEntitlement.startsAt = input.startsAt;

    existingEntitlement.set("expiresAt", input.expiresAt);

    if (input.entitlementType === "pillar") {
      existingEntitlement.pillar = new Types.ObjectId(input.pillarId);

      existingEntitlement.set("targetId", undefined);
    } else {
      existingEntitlement.targetId = new Types.ObjectId(input.targetId);

      existingEntitlement.set("pillar", undefined);
    }

    existingEntitlement.set(
      "paymentSession",
      input.paymentSessionId
        ? new Types.ObjectId(input.paymentSessionId)
        : undefined,
    );

    existingEntitlement.set(
      "grantedBy",
      input.grantedBy ? new Types.ObjectId(input.grantedBy) : undefined,
    );

    existingEntitlement.set("statusChangedBy", undefined);

    existingEntitlement.set("statusReason", undefined);

    existingEntitlement.set("revokedAt", undefined);

    existingEntitlement.set("refundedAt", undefined);

    existingEntitlement.set("expiredAt", undefined);

    await existingEntitlement.save();

    const populated = await populateEntitlement(existingEntitlement._id);

    assertFound(populated, "Entitlement not found after update", 500);

    return populated;
  }

  const createData: Record<string, unknown> = {
    user: new Types.ObjectId(input.userId),

    entitlementType: input.entitlementType,

    entitlementKey,

    source: input.source,

    status: "active",

    startsAt: input.startsAt,
  };

  if (input.entitlementType === "pillar") {
    createData.pillar = new Types.ObjectId(input.pillarId);
  } else {
    createData.targetId = new Types.ObjectId(input.targetId);
  }

  if (input.expiresAt) {
    createData.expiresAt = input.expiresAt;
  }

  if (input.paymentSessionId) {
    createData.paymentSession = new Types.ObjectId(input.paymentSessionId);
  }

  if (input.grantedBy) {
    createData.grantedBy = new Types.ObjectId(input.grantedBy);
  }

  try {
    const entitlement = await UserEntitlement.create(createData);

    const populated = await populateEntitlement(entitlement._id);

    assertFound(populated, "Entitlement not found after creation", 500);

    return populated;
  } catch (error) {
    /**
     * একই Stripe webhook একাধিকবার আসলেও
     * duplicate entitlement তৈরি হবে না।
     */
    if (isDuplicateKeyError(error)) {
      const entitlement = await UserEntitlement.findOne({
        user: new Types.ObjectId(input.userId),

        entitlementKey,
      });

      assertFound(
        entitlement,
        "Existing entitlement could not be retrieved",
        409,
      );

      return entitlement;
    }

    throw error;
  }
};

const grantEntitlementByAdmin = async (
  payload: IGrantUserEntitlementInput,
  actorId: string,
) => {
  const entitlementType = payload.entitlementType ?? "pillar";

  const startsAt = parseOptionalDate(payload.startsAt);

  const expiresAt = parseNullableDate(payload.expiresAt);

  return grantEntitlementInternal({
    userId: payload.user,

    entitlementType,

    ...(payload.pillar !== undefined
      ? {
          pillarId: payload.pillar,
        }
      : {}),

    ...(payload.targetId !== undefined
      ? {
          targetId: payload.targetId,
        }
      : {}),

    source: payload.source ?? "admin",

    ...(payload.paymentSession !== undefined
      ? {
          paymentSessionId: payload.paymentSession,
        }
      : {}),

    startsAt,

    ...(expiresAt !== undefined ? { expiresAt } : {}),

    grantedBy: actorId,
  });
};


const activatePillarEntitlementFromPayment = async (
  payload: IActivatePillarFromPaymentInput,
) => {
  return grantEntitlementInternal({
    userId: payload.userId,

    entitlementType: "pillar",

    pillarId: payload.pillarId,

    source: "stripe",

    paymentSessionId: payload.paymentSessionId,

    startsAt: payload.startsAt ?? new Date(),

    ...(payload.expiresAt !== undefined
      ? {
          expiresAt: payload.expiresAt,
        }
      : {}),
  });
};

const hasActivePillarEntitlement = async (
  userId: string,
  pillarId: string,
): Promise<boolean> => {
  assertValidObjectId(userId, "User ID");

  assertValidObjectId(pillarId, "Pillar ID");

  await expirePastEntitlements(userId);

  const now = new Date();

  const filter: QueryFilter<IUserEntitlement> = {
    user: new Types.ObjectId(userId),

    entitlementType: "pillar",

    pillar: new Types.ObjectId(pillarId),

    status: "active",

    startsAt: {
      $lte: now,
    },

    $or: [
      {
        expiresAt: {
          $exists: false,
        },
      },
      {
        expiresAt: {
          $gt: now,
        },
      },
    ],
  };

  const entitlement = await UserEntitlement.exists(filter);

  return Boolean(entitlement);
};

const checkPillarAccess = async (userId: string, pillarId: string) => {
  assertValidObjectId(userId, "User ID");

  assertValidObjectId(pillarId, "Pillar ID");

  const pillar = await ChallengePillar.findOne({
    _id: pillarId,
    status: "published",
  }).select("name slug title isPaid priceCents currency status");

  assertFound(pillar, "Challenge pillar not found or unavailable", 404);

  /**
   * Free pillar হলে entitlement লাগবে না।
   */
  if (!pillar.isPaid) {
    return {
      hasAccess: true,
      accessType: "free" as const,
      reason: "free_pillar",

      pillar,
      entitlement: null,
    };
  }

  await expirePastEntitlements(userId);

  const now = new Date();

  const entitlement = await UserEntitlement.findOne({
    user: new Types.ObjectId(userId),

    entitlementType: "pillar",

    pillar: new Types.ObjectId(pillarId),

    status: "active",

    startsAt: {
      $lte: now,
    },

    $or: [
      {
        expiresAt: {
          $exists: false,
        },
      },
      {
        expiresAt: {
          $gt: now,
        },
      },
    ],
  }).populate("paymentSession", "status purpose amountTotal currency");

  if (!entitlement) {
    return {
      hasAccess: false,
      accessType: "locked" as const,
      reason: "pillar_purchase_required",

      pillar,
      entitlement: null,
    };
  }

  return {
    hasAccess: true,
    accessType: "purchased" as const,
    reason: "active_pillar_entitlement",

    pillar,
    entitlement,
  };
};

const getMyEntitlements = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  await expirePastEntitlements(userId);

  const entitlements = await UserEntitlement.find({
    user: new Types.ObjectId(userId),
  })
    .sort({
      createdAt: -1,
    })
    .populate("pillar", "name slug title isPaid priceCents currency status")
    .populate(
      "paymentSession",
      "purpose status amountTotal currency stripeCheckoutSessionId",
    );

  const now = new Date();

  return entitlements.map((entitlement) => {
    const isCurrentlyActive =
      entitlement.status === "active" &&
      entitlement.startsAt <= now &&
      (!entitlement.expiresAt || entitlement.expiresAt > now);

    return {
      ...entitlement.toObject(),

      hasAccess: isCurrentlyActive,
    };
  });
};

const getAllEntitlements = async (options: IGetEntitlementsOptions) => {
  await expirePastEntitlements();

  const page = options.page ?? 1;

  const limit = options.limit ?? 20;

  const skip = (page - 1) * limit;

  const filter: QueryFilter<IUserEntitlement> = {};

  if (options.userId) {
    assertValidObjectId(options.userId, "User ID");

    filter.user = new Types.ObjectId(options.userId);
  }

  if (options.pillarId) {
    assertValidObjectId(options.pillarId, "Pillar ID");

    filter.pillar = new Types.ObjectId(options.pillarId);
  }

  if (options.entitlementType) {
    filter.entitlementType = options.entitlementType;
  }

  if (options.source) {
    filter.source = options.source;
  }

  if (options.status) {
    filter.status = options.status;
  }

  const [data, total] = await Promise.all([
    UserEntitlement.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate(
        "user",
        "fullName email role accessTo profileImage accountStatus",
      )
      .populate("pillar", "name slug title isPaid priceCents currency status")
      .populate(
        "paymentSession",
        "purpose status amountTotal currency stripeCheckoutSessionId",
      )
      .populate("grantedBy", "fullName email role")
      .populate("statusChangedBy", "fullName email role"),

    UserEntitlement.countDocuments(filter),
  ]);

  return {
    data,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleEntitlement = async (entitlementId: string) => {
  assertValidObjectId(entitlementId, "Entitlement ID");

  const entitlement = await populateEntitlement(entitlementId);

  assertFound(entitlement, "User entitlement not found", 404);

  return entitlement;
};

type StatusChangeInput = {
  entitlementId: string;

  status: "revoked" | "refunded" | "expired";

  actorId: string;

  reason?: string | undefined;
};

const changeEntitlementStatus = async (input: StatusChangeInput) => {
  assertValidObjectId(input.entitlementId, "Entitlement ID");

  assertValidObjectId(input.actorId, "Actor ID");

  const entitlement = await UserEntitlement.findById(input.entitlementId);

  assertFound(entitlement, "User entitlement not found", 404);

  entitlement.status = input.status;

  entitlement.statusChangedBy = new Types.ObjectId(input.actorId);

  if (input.reason !== undefined) {
    entitlement.statusReason = input.reason;
  } else {
    entitlement.set("statusReason", undefined);
  }

  const now = new Date();

  if (input.status === "revoked") {
    entitlement.revokedAt = now;

    entitlement.set("refundedAt", undefined);

    entitlement.set("expiredAt", undefined);
  }

  if (input.status === "refunded") {
    entitlement.refundedAt = now;

    entitlement.set("revokedAt", undefined);

    entitlement.set("expiredAt", undefined);
  }

  if (input.status === "expired") {
    entitlement.expiredAt = now;

    entitlement.set("revokedAt", undefined);

    entitlement.set("refundedAt", undefined);
  }

  await entitlement.save();

  const populated = await populateEntitlement(entitlement._id);

  assertFound(populated, "Entitlement not found after status update", 500);

  return populated;
};

const revokeEntitlement = async (
  entitlementId: string,
  payload: IEntitlementStatusInput,
  actorId: string,
) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "revoked",
    actorId,

    ...(payload.reason !== undefined
      ? {
          reason: payload.reason,
        }
      : {}),
  });
};

const refundEntitlement = async (
  entitlementId: string,
  payload: IEntitlementStatusInput,
  actorId: string,
) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "refunded",
    actorId,

    ...(payload.reason !== undefined
      ? {
          reason: payload.reason,
        }
      : {}),
  });
};

const expireEntitlement = async (
  entitlementId: string,
  payload: IEntitlementStatusInput,
  actorId: string,
) => {
  return changeEntitlementStatus({
    entitlementId,
    status: "expired",
    actorId,

    ...(payload.reason !== undefined
      ? {
          reason: payload.reason,
        }
      : {}),
  });
};

const reactivateEntitlement = async (
  entitlementId: string,
  payload: IReactivateEntitlementInput,
  actorId: string,
) => {
  assertValidObjectId(entitlementId, "Entitlement ID");

  const entitlement = await UserEntitlement.findById(entitlementId);

  assertFound(entitlement, "User entitlement not found", 404);

  const startsAt = parseOptionalDate(payload.startsAt);

  const expiresAt = parseNullableDate(payload.expiresAt);

  validateDateRange(startsAt, expiresAt);

  entitlement.status = "active";

  entitlement.source = payload.source ?? "admin";

  entitlement.startsAt = startsAt;

  entitlement.set("expiresAt", expiresAt);

  entitlement.grantedBy = new Types.ObjectId(actorId);

  entitlement.set("statusChangedBy", undefined);

  entitlement.set("statusReason", undefined);

  entitlement.set("revokedAt", undefined);

  entitlement.set("refundedAt", undefined);

  entitlement.set("expiredAt", undefined);

  /**
   * Manual reactivation হলে পুরোনো payment
   * session relation clear করা হচ্ছে।
   */
  entitlement.set("paymentSession", undefined);

  await entitlement.save();

  const populated = await populateEntitlement(entitlement._id);

  assertFound(populated, "Entitlement not found after reactivation", 500);

  return populated;
};

export const userEntitlementService = {
  grantEntitlementByAdmin,

  activatePillarEntitlementFromPayment,

  hasActivePillarEntitlement,
  checkPillarAccess,

  getMyEntitlements,
  getAllEntitlements,
  getSingleEntitlement,

  revokeEntitlement,
  refundEntitlement,
  expireEntitlement,
  reactivateEntitlement,
};
