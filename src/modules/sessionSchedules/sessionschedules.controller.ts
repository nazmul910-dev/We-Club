import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import {
  ISessionScheduleQuery,
  SessionStatus,
  SessionType,
} from "./sessionschedules.interface";

import { sessionScheduleService } from "./sessionschedules.service";

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

const createSessionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorId = getAuthUserId(req);

    const result = await sessionScheduleService.createSessionSchedule(
      req.body,
      actorId,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Session scheduled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllSessionSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options: ISessionScheduleQuery = {
      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),
    };

    if (typeof req.query.hostId === "string") {
      options.hostId = req.query.hostId;
    }

    if (typeof req.query.pillarId === "string") {
      options.pillarId = req.query.pillarId;
    }

    if (typeof req.query.courseModuleId === "string") {
      options.courseModuleId = req.query.courseModuleId;
    }

    if (typeof req.query.sessionType === "string") {
      options.sessionType = req.query.sessionType as SessionType;
    }

    if (typeof req.query.status === "string") {
      options.status = req.query.status as SessionStatus;
    }

    if (typeof req.query.startDate === "string") {
      options.startDate = req.query.startDate;
    }

    if (typeof req.query.endDate === "string") {
      options.endDate = req.query.endDate;
    }

    const result =
      await sessionScheduleService.getAllSessionSchedules(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session schedules retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleSessionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await sessionScheduleService.getSingleSessionSchedule(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateSessionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorId = getAuthUserId(req);

    const result = await sessionScheduleService.updateSessionSchedule(
      String(req.params.id),
      req.body,
      actorId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancelSessionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorId = getAuthUserId(req);

    const result = await sessionScheduleService.cancelSessionSchedule(
      String(req.params.id),
      req.body,
      actorId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSessionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorId = getAuthUserId(req);

    const result = await sessionScheduleService.deleteSessionSchedule(
      String(req.params.id),
      actorId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Session schedule deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sessionScheduleController = {
  createSessionSchedule,

  getAllSessionSchedules,
  getSingleSessionSchedule,

  updateSessionSchedule,
  cancelSessionSchedule,
  deleteSessionSchedule,
};