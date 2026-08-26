import { QueryFilter, Types } from "mongoose";

/**
 * User model আগে থেকেই বানানো আছে — শুধু import করা হচ্ছে।
 */
import { User } from "../users/users.model.schema";

import {
  IActivityLog,
  ICreateActivityLogInput,
  IGetActivityLogsOptions,
} from "./activitylog.interface";

import { ActivityLog } from "./activity.model.schema";

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

const ensureActorExists = async (actorId: string) => {
  assertValidObjectId(actorId, "Actor ID");

  const actor = await User.findById(actorId).select("_id fullName email role");

  assertFound(actor, "Actor not found", 404);

  return actor;
};

/**
 * Append-only audit entry তৈরি করে।
 *
 * অন্য যেকোনো module (admin controller, entitlements service ইত্যাদি)
 * থেকে সরাসরি এই function import করে কল করা যাবে,
 * যাতে গুরুত্বপূর্ণ admin/manager action গুলো auto log হয়।
 */
const createActivityLog = async (payload: ICreateActivityLogInput) => {
  await ensureActorExists(payload.actor);

  if (payload.targetEntityId) {
    assertValidObjectId(payload.targetEntityId, "Target entity ID");
  }

  const createData: Record<string, unknown> = {
    actor: new Types.ObjectId(payload.actor),

    action: payload.action,
    targetEntityType: payload.targetEntityType,
  };

  if (payload.targetEntityId) {
    createData.targetEntityId = new Types.ObjectId(payload.targetEntityId);
  }

  if (payload.changeSummary !== undefined) {
    createData.changeSummary = payload.changeSummary;
  }

  if (payload.changes !== undefined) {
    createData.changes = payload.changes;
  }

  if (payload.ipAddress !== undefined) {
    createData.ipAddress = payload.ipAddress;
  }

  if (payload.userAgent !== undefined) {
    createData.userAgent = payload.userAgent;
  }

  const log = await ActivityLog.create(createData);

  const populated = await ActivityLog.findById(log._id).populate(
    "actor",
    "fullName email role",
  );

  assertFound(populated, "Activity log not found after creation", 500);

  return populated;
};

const getAllActivityLogs = async (options: IGetActivityLogsOptions) => {
  const page = options.page ?? 1;

  const limit = Math.min(options.limit ?? 20, 100);

  const skip = (page - 1) * limit;

  const filter: QueryFilter<IActivityLog> = {};

  if (options.actorId) {
    assertValidObjectId(options.actorId, "Actor ID");

    filter.actor = new Types.ObjectId(options.actorId);
  }

  if (options.action) {
    filter.action = options.action;
  }

  if (options.targetEntityType) {
    filter.targetEntityType = options.targetEntityType;
  }

  if (options.targetEntityId) {
    assertValidObjectId(options.targetEntityId, "Target entity ID");

    filter.targetEntityId = new Types.ObjectId(options.targetEntityId);
  }

  const [data, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("actor", "fullName email role")
      .lean(),

    ActivityLog.countDocuments(filter),
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

const getSingleActivityLog = async (logId: string) => {
  assertValidObjectId(logId, "Activity log ID");

  const log = await ActivityLog.findById(logId).populate(
    "actor",
    "fullName email role",
  ).lean();

  assertFound(log, "Activity log not found", 404);

  return log;
};

export const activityLogService = {
  createActivityLog,

  getAllActivityLogs,
  getSingleActivityLog,
};