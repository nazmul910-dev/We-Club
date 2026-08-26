import { QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";

import { ChallengePillar } from "../challengePillars/challenge.pillar.model.schema";

import { CourseModule } from "../courseModules/course.module.model.schema";


import { activityLogService } from "../activitylogs/activitylog.service";

import {
  ICancelSessionSchedule,
  ICreateSessionSchedule,
  ISessionSchedule,
  ISessionScheduleQuery,
  IUpdateSessionSchedule,
} from "./sessionschedules.interface";

import { SessionSchedule } from "./sessionschedules.model.schema";

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

/**
 * Log লেখা fail করলেও schedule create/update/cancel কখনো fail করবে না।
 */
const safeLogActivityEvent = async (params: {
  actorId: string;

  action: "create" | "update" | "delete";

  targetEntityId: string;

  changeSummary?: string | undefined;
}): Promise<void> => {
  try {
    await activityLogService.createActivityLog({
      actor: params.actorId,

      action: params.action,

      targetEntityType: "SessionSchedule",

      targetEntityId: params.targetEntityId,

      ...(params.changeSummary !== undefined
        ? { changeSummary: params.changeSummary }
        : {}),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to write activity log:", error);
  }
};

const ensureHostExists = async (hostId: string) => {
  assertValidObjectId(hostId, "Host ID");

  const host = await User.findById(hostId).select("_id fullName email role");

  assertFound(host, "Host user not found", 404);

  return host;
};

const ensurePillarExists = async (pillarId: string) => {
  assertValidObjectId(pillarId, "Pillar ID");

  const pillar = await ChallengePillar.findById(pillarId);

  assertFound(pillar, "Challenge pillar not found", 404);

  return pillar;
};

const ensureCourseModuleExists = async (courseModuleId: string) => {
  assertValidObjectId(courseModuleId, "Course module ID");

  const courseModule = await CourseModule.findById(courseModuleId);

  assertFound(courseModule, "Course module not found", 404);

  return courseModule;
};

/**
 * "Prevent conflicting schedule where required" — একই host-এর
 * সময়ে overlap করা আরেকটা active (cancelled নয়) session আছে কিনা চেক করে।
 */
const assertNoHostConflict = async (params: {
  hostId: string;
  startTime: Date;
  endTime: Date;
  excludeSessionId?: string | undefined;
}): Promise<void> => {
  const filter: QueryFilter<ISessionSchedule> = {
    host: new Types.ObjectId(params.hostId),

    status: { $nin: ["cancelled"] },

    startTime: { $lt: params.endTime },
    endTime: { $gt: params.startTime },
  };

  if (params.excludeSessionId) {
    filter._id = { $ne: new Types.ObjectId(params.excludeSessionId) };
  }

  const conflictingSession = await SessionSchedule.findOne(filter);

  if (conflictingSession) {
    throwServiceError(
      "This host already has a session scheduled during this time range",
      409,
    );
  }
};

const populateSessionSchedule = (id: Types.ObjectId) =>
  SessionSchedule.findById(id)
    .populate("host", "fullName email role")
    .populate("pillar", "name slug title")
    .populate("courseModule", "title slug")
    .populate("createdBy", "fullName email role")
    .populate("updatedBy", "fullName email role")
    .populate("cancelledBy", "fullName email role");

const createSessionSchedule = async (
  payload: ICreateSessionSchedule,
  actorId: string,
) => {
  await ensureHostExists(payload.host);

  if (payload.pillar) {
    await ensurePillarExists(payload.pillar);
  }

  if (payload.courseModule) {
    await ensureCourseModuleExists(payload.courseModule);
  }

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);

  if (endTime.getTime() <= startTime.getTime()) {
    throwServiceError("End time must be after start time", 400);
  }

  await assertNoHostConflict({
    hostId: payload.host,
    startTime,
    endTime,
  });

  const createData: Record<string, unknown> = {
    title: payload.title,
    sessionType: payload.sessionType,

    host: new Types.ObjectId(payload.host),

    startTime,
    endTime,
    timezone: payload.timezone,

    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.description !== undefined) {
    createData.description = payload.description;
  }

  if (payload.pillar) {
    createData.pillar = new Types.ObjectId(payload.pillar);
  }

  if (payload.courseModule) {
    createData.courseModule = new Types.ObjectId(payload.courseModule);
  }

  if (payload.meetingUrl !== undefined) {
    createData.meetingUrl = payload.meetingUrl;
  }

  if (payload.capacity !== undefined) {
    createData.capacity = payload.capacity;
  }

  const session = await SessionSchedule.create(createData);

  await safeLogActivityEvent({
    actorId,

    action: "create",

    targetEntityId: session._id.toString(),

    changeSummary: `Session "${payload.title}" scheduled`,
  });

  const populated = await populateSessionSchedule(session._id);

  assertFound(populated, "Session schedule not found after creation", 500);

  return populated;
};

const getAllSessionSchedules = async (options: ISessionScheduleQuery) => {
  const page = options.page ?? 1;

  const limit = options.limit ?? 20;

  const skip = (page - 1) * limit;

  const filter: QueryFilter<ISessionSchedule> = {};

  if (options.hostId) {
    assertValidObjectId(options.hostId, "Host ID");

    filter.host = new Types.ObjectId(options.hostId);
  }

  if (options.pillarId) {
    assertValidObjectId(options.pillarId, "Pillar ID");

    filter.pillar = new Types.ObjectId(options.pillarId);
  }

  if (options.courseModuleId) {
    assertValidObjectId(options.courseModuleId, "Course module ID");

    filter.courseModule = new Types.ObjectId(options.courseModuleId);
  }

  if (options.sessionType) {
    filter.sessionType = options.sessionType;
  }

  if (options.status) {
    filter.status = options.status;
  }

  if (options.startDate || options.endDate) {
    filter.startTime = {};

    if (options.startDate) {
      (filter.startTime as Record<string, unknown>).$gte = new Date(
        options.startDate,
      );
    }

    if (options.endDate) {
      (filter.startTime as Record<string, unknown>).$lte = new Date(
        options.endDate,
      );
    }
  }

  const [data, total] = await Promise.all([
    SessionSchedule.find(filter)
      .sort({
        startTime: 1,
      })
      .skip(skip)
      .limit(limit)
      .populate("host", "fullName email role")
      .populate("pillar", "name slug title")
      .populate("courseModule", "title slug")
      .lean(),

    SessionSchedule.countDocuments(filter),
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

const getSingleSessionSchedule = async (sessionId: string) => {
  assertValidObjectId(sessionId, "Session schedule ID");

  const session = await populateSessionSchedule(
    new Types.ObjectId(sessionId),
  );

  assertFound(session, "Session schedule not found", 404);

  return session;
};

const updateSessionSchedule = async (
  sessionId: string,
  payload: IUpdateSessionSchedule,
  actorId: string,
) => {
  assertValidObjectId(sessionId, "Session schedule ID");

  const session = await SessionSchedule.findById(sessionId);

  assertFound(session, "Session schedule not found", 404);

  if (session.status === "cancelled") {
    throwServiceError("Cannot update a cancelled session", 400);
  }

  if (payload.host) {
    await ensureHostExists(payload.host);

    session.host = new Types.ObjectId(payload.host);
  }

  if (payload.pillar !== undefined) {
    if (payload.pillar === null) {
      session.set("pillar", undefined);
    } else {
      await ensurePillarExists(payload.pillar);

      session.pillar = new Types.ObjectId(payload.pillar);
    }
  }

  if (payload.courseModule !== undefined) {
    if (payload.courseModule === null) {
      session.set("courseModule", undefined);
    } else {
      await ensureCourseModuleExists(payload.courseModule);

      session.courseModule = new Types.ObjectId(payload.courseModule);
    }
  }

  const nextStartTime = payload.startTime
    ? new Date(payload.startTime)
    : session.startTime;

  const nextEndTime = payload.endTime
    ? new Date(payload.endTime)
    : session.endTime;

  if (nextEndTime.getTime() <= nextStartTime.getTime()) {
    throwServiceError("End time must be after start time", 400);
  }

  if (payload.startTime || payload.endTime || payload.host) {
    await assertNoHostConflict({
      hostId: payload.host ?? session.host.toString(),
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeSessionId: sessionId,
    });
  }

  session.startTime = nextStartTime;
  session.endTime = nextEndTime;

  if (payload.title !== undefined) {
    session.title = payload.title;
  }

  if (payload.description !== undefined) {
    session.description = payload.description;
  }

  if (payload.sessionType !== undefined) {
    session.sessionType = payload.sessionType;
  }

  if (payload.timezone !== undefined) {
    session.timezone = payload.timezone;
  }

  if (payload.meetingUrl !== undefined) {
    session.set(
      "meetingUrl",
      payload.meetingUrl === null ? undefined : payload.meetingUrl,
    );
  }

  if (payload.capacity !== undefined) {
    session.set(
      "capacity",
      payload.capacity === null ? undefined : payload.capacity,
    );
  }

  if (payload.status !== undefined) {
    session.status = payload.status;
  }

  session.updatedBy = new Types.ObjectId(actorId);

  await session.save();

  await safeLogActivityEvent({
    actorId,

    action: "update",

    targetEntityId: session._id.toString(),

    changeSummary: `Session "${session.title}" updated`,
  });

  const populated = await populateSessionSchedule(session._id);

  assertFound(populated, "Session schedule not found after update", 500);

  return populated;
};

const cancelSessionSchedule = async (
  sessionId: string,
  payload: ICancelSessionSchedule,
  actorId: string,
) => {
  assertValidObjectId(sessionId, "Session schedule ID");

  const session = await SessionSchedule.findById(sessionId);

  assertFound(session, "Session schedule not found", 404);

  if (session.status === "cancelled") {
    throwServiceError("Session is already cancelled", 400);
  }

  if (session.status === "completed") {
    throwServiceError("Cannot cancel a completed session", 400);
  }

  session.status = "cancelled";
  session.cancellationReason = payload.reason;
  session.cancelledBy = new Types.ObjectId(actorId);
  session.cancelledAt = new Date();
  session.updatedBy = new Types.ObjectId(actorId);

  await session.save();

  await safeLogActivityEvent({
    actorId,

    action: "update",

    targetEntityId: session._id.toString(),

    changeSummary: `Session "${session.title}" cancelled — ${payload.reason}`,
  });

  const populated = await populateSessionSchedule(session._id);

  assertFound(populated, "Session schedule not found after cancellation", 500);

  return populated;
};

const deleteSessionSchedule = async (sessionId: string, actorId: string) => {
  assertValidObjectId(sessionId, "Session schedule ID");

  const session = await SessionSchedule.findById(sessionId);

  assertFound(session, "Session schedule not found", 404);

  await SessionSchedule.findByIdAndDelete(sessionId);

  await safeLogActivityEvent({
    actorId,

    action: "delete",

    targetEntityId: sessionId,

    changeSummary: `Session "${session.title}" deleted`,
  });

  return {
    message: "Session schedule deleted successfully",
  };
};

export const sessionScheduleService = {
  createSessionSchedule,

  getAllSessionSchedules,
  getSingleSessionSchedule,

  updateSessionSchedule,
  cancelSessionSchedule,
  deleteSessionSchedule,
};