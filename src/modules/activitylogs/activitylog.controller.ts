import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import {
  ActivityLogAction,
  ActivityLogEntityType,
  IGetActivityLogsOptions,
} from "./activitylog.interface";

import { activityLogService } from "./activitylog.service";

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

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  const user = req.user;

  assertFound(user, "Authentication required", 401);

  return {
    id: user.id as string,
    role: user.role as string,
  };
};

const createActivityLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await activityLogService.createActivityLog({
      ...req.body,

      actor: req.body.actor ?? authUser.id,

      ipAddress: req.body.ipAddress ?? req.ip,

      userAgent: req.body.userAgent ?? req.headers["user-agent"],
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Activity log created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options: IGetActivityLogsOptions = {
      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),
    };

    if (typeof req.query.actorId === "string") {
      options.actorId = req.query.actorId;
    }

    if (typeof req.query.action === "string") {
      options.action = req.query.action as ActivityLogAction;
    }

    if (typeof req.query.targetEntityType === "string") {
      options.targetEntityType = req.query
        .targetEntityType as ActivityLogEntityType;
    }

    if (typeof req.query.targetEntityId === "string") {
      options.targetEntityId = req.query.targetEntityId;
    }

    const result = await activityLogService.getAllActivityLogs(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Activity logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleActivityLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await activityLogService.getSingleActivityLog(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Activity log retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const activityLogController = {
  createActivityLog,

  getAllActivityLogs,
  getSingleActivityLog,
};