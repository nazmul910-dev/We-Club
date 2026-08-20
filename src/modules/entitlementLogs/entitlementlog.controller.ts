import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import { entitlementLogService } from "./entitlementlog.service";

import {
  EntitlementLogAction,
  EntitlementLogSource,
  IGetEntitlementLogsOptions,
} from "./entitlementlog.interface";

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

const createEntitlementLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await entitlementLogService.createEntitlementLog({
      ...req.body,

      actor: req.body.actor ?? authUser.id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Entitlement log created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllEntitlementLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options: IGetEntitlementLogsOptions = {
      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),
    };

    if (typeof req.query.userId === "string") {
      options.userId = req.query.userId;
    }

    if (typeof req.query.entitlementId === "string") {
      options.entitlementId = req.query.entitlementId;
    }

    if (typeof req.query.pillarId === "string") {
      options.pillarId = req.query.pillarId;
    }

    if (typeof req.query.action === "string") {
      options.action = req.query.action as EntitlementLogAction;
    }

    if (typeof req.query.source === "string") {
      options.source = req.query.source as EntitlementLogSource;
    }

    const result = await entitlementLogService.getAllEntitlementLogs(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Entitlement logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEntitlementLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await entitlementLogService.getMyEntitlementLogs(
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your entitlement logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleEntitlementLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await entitlementLogService.getSingleEntitlementLog(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Entitlement log retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const entitlementLogController = {
  createEntitlementLog,

  getAllEntitlementLogs,
  getMyEntitlementLogs,
  getSingleEntitlementLog,
};