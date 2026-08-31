import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import {
  ISessionAttendanceQuery,
  SessionAttendanceStatus,
} from "./sessionattendances.interface";

import { sessionAttendanceService } from "./sessionattendances.service";

const throwControllerError = (message: string, status: number): never => {
  const error = new Error(message) as any;
  error.status = status;
  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwControllerError(message, statusCode);
  }
};

const getAuthUserId = (req: Request): string => {
  const user = req.user;

  assertFound(user, "Authentication required", 401);

  const id = user.id;

  assertFound(id, "Authentication required", 401);

  return id;
};

/**
 * Logged-in user নিজে register করে; admin অন্য user-এর হয়েও
 * register করতে পারে যদি body-তে user id দেওয়া থাকে।
 */
const registerSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUserId = getAuthUserId(req);

    const result = await sessionAttendanceService.registerSessionAttendance({
      session: req.body.session,
      user: req.body.user ?? authUserId,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Registered for session successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorId = getAuthUserId(req);

    const result = await sessionAttendanceService.markSessionAttendance({
      ...req.body,

      markedBy: req.body.markedBy ?? actorId,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Attendance marked successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancelSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUserId = getAuthUserId(req);
    const targetUserId = req.body.user ?? authUserId;
    const isStaff = ["founder", "manager", "admin", "super_admin"].includes(
      req.user?.role ?? "",
    );

    if (!isStaff && targetUserId !== authUserId) {
      throwControllerError("You are not authorized to cancel this attendance", 403);
    }

    const result = await sessionAttendanceService.cancelSessionAttendance({
      session: req.body.session,
      user: targetUserId,
      reason: req.body.reason ?? "Cancelled by user",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session attendance cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllSessionAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options: ISessionAttendanceQuery = {
      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),
    };

    if (typeof req.query.sessionId === "string") {
      options.sessionId = req.query.sessionId;
    }

    if (typeof req.query.userId === "string") {
      options.userId = req.query.userId;
    }

    if (typeof req.query.status === "string") {
      options.status = req.query.status as SessionAttendanceStatus;
    }

    const result =
      await sessionAttendanceService.getAllSessionAttendances(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session attendances retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMySessionAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUserId = getAuthUserId(req);

    const result =
      await sessionAttendanceService.getMySessionAttendances(authUserId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your session attendances retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await sessionAttendanceService.getSingleSessionAttendance(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session attendance retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sessionAttendanceController = {
  registerSessionAttendance,
  markSessionAttendance,
  cancelSessionAttendance,

  getAllSessionAttendances,
  getMySessionAttendances,
  getSingleSessionAttendance,
};