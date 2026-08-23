import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import { ICreateStreakLogInput, IStreakLogQuery } from "./streaklog.interface";
import { streakLogService } from "./streaklog.service";

const getAuthUser = (req: Request) => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const createStreakLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = getAuthUser(req);

    const payload: ICreateStreakLogInput = {
      ...req.body,
      user: req.body.user ?? auth.id,
    };

    const result = await streakLogService.createStreakLog(payload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Streak log created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyStreakLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = getAuthUser(req);

    const query: IStreakLogQuery = {
      userId: auth.id,
      page: typeof req.query.page === "string" ? Number(req.query.page) : undefined,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    };

    if (typeof req.query.fromDate === "string") {
      query.fromDate = req.query.fromDate;
    }

    if (typeof req.query.toDate === "string") {
      query.toDate = req.query.toDate;
    }

    const result = await streakLogService.getStreakLogs(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Streak logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStreakLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IStreakLogQuery = {};

    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }

    if (typeof req.query.academyProfileId === "string") {
      query.academyProfileId = req.query.academyProfileId;
    }

    if (typeof req.query.timezone === "string") {
      query.timezone = req.query.timezone as never;
    }

    if (typeof req.query.fromDate === "string") {
      query.fromDate = req.query.fromDate;
    }

    if (typeof req.query.toDate === "string") {
      query.toDate = req.query.toDate;
    }

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await streakLogService.getStreakLogs(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Streak logs retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleStreakLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await streakLogService.getSingleStreakLog(String(req.params.id));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Streak log retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const streakLogController = {
  createStreakLog,
  getMyStreakLogs,
  getStreakLogs,
  getSingleStreakLog,
};
