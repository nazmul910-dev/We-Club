import { QueryFilter, Types } from "mongoose";

/**
 * নিচের model গুলো ইতিমধ্যে প্রজেক্টে বানানো আছে —
 * এখানে শুধু import করে reference হিসেবে ব্যবহার করা হচ্ছে,
 * নতুন করে কোনো model তৈরি করা হয়নি।
 */
import { User } from "../users/users.model.schema";

import { UserEntitlement } from "../userEntitlements/userEntitlements.model.schema";

import {
  ICreateEntitlementLogInput,
  IEntitlementLog,
  IGetEntitlementLogsOptions,
} from "./entitlementlog.interface";

import { EntitlementLog } from "./entitlement.model.schema";

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

const ensureUserExists = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const user = await User.findById(userId).select("_id fullName email role");

  assertFound(user, "User not found", 404);

  return user;
};

const ensureEntitlementExists = async (entitlementId: string) => {
  assertValidObjectId(entitlementId, "Entitlement ID");

  const entitlement = await UserEntitlement.findById(entitlementId);

  assertFound(entitlement, "User entitlement not found", 404);

  return entitlement;
};

/**
 * Append-only audit entry তৈরি করে।
 *
 * অন্য module (userEntitlements service, payment webhook ইত্যাদি)
 * থেকেও সরাসরি এই function import করে কল করা যাবে,
 * যাতে entitlement-এর প্রতিটি status change auto log হয়।
 */
const createEntitlementLog = async (payload: ICreateEntitlementLogInput) => {
  await ensureUserExists(payload.user);

  const entitlement = await ensureEntitlementExists(payload.entitlement);

  if (payload.pillar) {
    assertValidObjectId(payload.pillar, "Pillar ID");
  }

  if (payload.paymentSession) {
    assertValidObjectId(payload.paymentSession, "Payment session ID");
  }

  if (payload.actor) {
    assertValidObjectId(payload.actor, "Actor ID");
  }

  const createData: Record<string, unknown> = {
    user: new Types.ObjectId(payload.user),

    entitlement: new Types.ObjectId(payload.entitlement),

    action: payload.action,
    source: payload.source,
  };

  const pillarId = payload.pillar ?? entitlement.pillar?.toString();

  if (pillarId) {
    createData.pillar = new Types.ObjectId(pillarId);
  }

  const paymentSessionId =
    payload.paymentSession ?? entitlement.paymentSession?.toString();

  if (paymentSessionId) {
    createData.paymentSession = new Types.ObjectId(paymentSessionId);
  }

  if (payload.reason !== undefined) {
    createData.reason = payload.reason;
  }

  if (payload.actor) {
    createData.actor = new Types.ObjectId(payload.actor);
  }

  if (payload.metadata !== undefined) {
    createData.metadata = payload.metadata;
  }

  const log = await EntitlementLog.create(createData);

  const populated = await EntitlementLog.findById(log._id)
    .populate("user", "fullName email role")
    .populate("entitlement", "entitlementType entitlementKey status")
    .populate("pillar", "name slug title")
    .populate("paymentSession", "purpose status amountTotal currency")
    .populate("actor", "fullName email role");

  assertFound(populated, "Entitlement log not found after creation", 500);

  return populated;
};

const getAllEntitlementLogs = async (options: IGetEntitlementLogsOptions) => {
  const page = options.page ?? 1;

  const limit = Math.min(options.limit ?? 20, 100);

  const skip = (page - 1) * limit;

  const filter: QueryFilter<IEntitlementLog> = {};

  if (options.userId) {
    assertValidObjectId(options.userId, "User ID");

    filter.user = new Types.ObjectId(options.userId);
  }

  if (options.entitlementId) {
    assertValidObjectId(options.entitlementId, "Entitlement ID");

    filter.entitlement = new Types.ObjectId(options.entitlementId);
  }

  if (options.pillarId) {
    assertValidObjectId(options.pillarId, "Pillar ID");

    filter.pillar = new Types.ObjectId(options.pillarId);
  }

  if (options.action) {
    filter.action = options.action;
  }

  if (options.source) {
    filter.source = options.source;
  }

  const [data, total] = await Promise.all([
    EntitlementLog.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email role")
      .populate("entitlement", "entitlementType entitlementKey status")
      .populate("pillar", "name slug title")
      .populate("paymentSession", "purpose status amountTotal currency")
      .populate("actor", "fullName email role").lean(),

    EntitlementLog.countDocuments(filter),
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

const getMyEntitlementLogs = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const logs = await EntitlementLog.find({
    user: new Types.ObjectId(userId),
  })
    .sort({
      createdAt: -1,
    })
    .populate("entitlement", "entitlementType entitlementKey status")
    .populate("pillar", "name slug title").lean();

  return logs;
};

const getSingleEntitlementLog = async (logId: string) => {
  assertValidObjectId(logId, "Entitlement log ID");

  const log = await EntitlementLog.findById(logId)
    .populate("user", "fullName email role")
    .populate("entitlement", "entitlementType entitlementKey status")
    .populate("pillar", "name slug title")
    .populate("paymentSession", "purpose status amountTotal currency")
    .populate("actor", "fullName email role").lean();

  assertFound(log, "Entitlement log not found", 404);

  return log;
};

export const entitlementLogService = {
  createEntitlementLog,

  getAllEntitlementLogs,
  getMyEntitlementLogs,
  getSingleEntitlementLog,
};