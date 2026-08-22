import { QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";

import { SessionSchedule } from "../sessionSchedules/sessionschedules.model.schema";

import {
  ICancelSessionAttendance,
  IMarkSessionAttendance,
  IRegisterSessionAttendance,
  ISessionAttendance,
  ISessionAttendanceQuery,
} from "./sessionattendances.interface";

import { SessionAttendance } from "./sessionattendances.model.schema";

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

const ensureSessionExists = async (sessionId: string) => {
  assertValidObjectId(sessionId, "Session ID");

  const session = await SessionSchedule.findById(sessionId);

  assertFound(session, "Session schedule not found", 404);

  return session;
};

const ensureUserExists = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const user = await User.findById(userId).select("_id fullName email role");

  assertFound(user, "User not found", 404);

  return user;
};

const populateAttendance = (id: Types.ObjectId) =>
  SessionAttendance.findById(id)
    .populate("session", "title sessionType startTime endTime status")
    .populate("user", "fullName email role")
    .populate("markedBy", "fullName email role");


const registerSessionAttendance = async (
  payload: IRegisterSessionAttendance,
) => {
  await ensureSessionExists(payload.session);
  await ensureUserExists(payload.user);

  const sessionObjectId = new Types.ObjectId(payload.session);
  const userObjectId = new Types.ObjectId(payload.user);

  const attendance = await SessionAttendance.findOneAndUpdate(
    {
      session: sessionObjectId,
      user: userObjectId,
    },
    {
      $setOnInsert: {
        session: sessionObjectId,
        user: userObjectId,
        status: "registered",
        registeredAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  const populated = await populateAttendance(attendance._id);

  assertFound(populated, "Session attendance not found after registration", 500);

  return populated;
};


const markSessionAttendance = async (payload: IMarkSessionAttendance) => {
  await ensureSessionExists(payload.session);
  await ensureUserExists(payload.user);

  const sessionObjectId = new Types.ObjectId(payload.session);
  const userObjectId = new Types.ObjectId(payload.user);

  const setData: Record<string, unknown> = {
    status: payload.status,
  };

  if (payload.status === "attended" || payload.status === "late") {
    setData.joinedAt = new Date();
  }

  if (payload.markedBy) {
    assertValidObjectId(payload.markedBy, "Marked by ID");

    setData.markedBy = new Types.ObjectId(payload.markedBy);
  }

  if (payload.notes !== undefined) {
    setData.notes = payload.notes;
  }

  const attendance = await SessionAttendance.findOneAndUpdate(
    {
      session: sessionObjectId,
      user: userObjectId,
    },
    {
      $set: setData,

      $setOnInsert: {
        session: sessionObjectId,
        user: userObjectId,
        registeredAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  const populated = await populateAttendance(attendance._id);

  assertFound(populated, "Session attendance not found after marking", 500);

  return populated;
};

const cancelSessionAttendance = async (
  payload: ICancelSessionAttendance,
) => {
  assertValidObjectId(payload.session, "Session ID");
  assertValidObjectId(payload.user, "User ID");

  const attendance = await SessionAttendance.findOne({
    session: new Types.ObjectId(payload.session),
    user: new Types.ObjectId(payload.user),
  });

  assertFound(attendance, "Session attendance record not found", 404);

  if (attendance.status === "cancelled") {
    // Idempotent — আগে থেকেই cancelled থাকলে আবার error না দিয়ে একই state ফেরত দেওয়া হচ্ছে।
    const populated = await populateAttendance(attendance._id);

    assertFound(populated, "Session attendance not found", 404);

    return populated;
  }

  attendance.status = "cancelled";
  attendance.cancellationReason = payload.reason;
  attendance.cancelledAt = new Date();

  await attendance.save();

  const populated = await populateAttendance(attendance._id);

  assertFound(populated, "Session attendance not found after cancellation", 500);

  return populated;
};

const getAllSessionAttendances = async (
  options: ISessionAttendanceQuery,
) => {
  const page = options.page ?? 1;

  const limit = options.limit ?? 20;

  const skip = (page - 1) * limit;

  const filter: QueryFilter<ISessionAttendance> = {};

  if (options.sessionId) {
    assertValidObjectId(options.sessionId, "Session ID");

    filter.session = new Types.ObjectId(options.sessionId);
  }

  if (options.userId) {
    assertValidObjectId(options.userId, "User ID");

    filter.user = new Types.ObjectId(options.userId);
  }

  if (options.status) {
    filter.status = options.status;
  }

  const [data, total] = await Promise.all([
    SessionAttendance.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("session", "title sessionType startTime endTime status")
      .populate("user", "fullName email role")
      .populate("markedBy", "fullName email role"),

    SessionAttendance.countDocuments(filter),
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

const getMySessionAttendances = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const attendances = await SessionAttendance.find({
    user: new Types.ObjectId(userId),
  })
    .sort({
      createdAt: -1,
    })
    .populate("session", "title sessionType startTime endTime status");

  return attendances;
};

const getSingleSessionAttendance = async (attendanceId: string) => {
  assertValidObjectId(attendanceId, "Session attendance ID");

  const attendance = await populateAttendance(
    new Types.ObjectId(attendanceId),
  );

  assertFound(attendance, "Session attendance not found", 404);

  return attendance;
};

export const sessionAttendanceService = {
  registerSessionAttendance,
  markSessionAttendance,
  cancelSessionAttendance,

  getAllSessionAttendances,
  getMySessionAttendances,
  getSingleSessionAttendance,
};