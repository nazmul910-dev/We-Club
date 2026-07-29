import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import { IModuleProgressAdminQuery } from "./module.progress.interface";
import { moduleProgressService } from "./module.progress.service";
import assertFound from "../../utility/assertFound";



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

const getMyModuleProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleProgressService.getMyModuleProgress(
      authUser.id,
      String(req.params.moduleId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Module progress retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMyModuleProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleProgressService.refreshModuleProgress(
      authUser.id,
      String(req.params.moduleId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Module progress recalculated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAllModuleProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleProgressService.getMyAllModuleProgress(
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Module progress history retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserModuleProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await moduleProgressService.getUserModuleProgress(
      String(req.params.userId),

      String(req.params.moduleId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "User module progress retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllModuleProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IModuleProgressAdminQuery = {};

    if (typeof req.query.userId === "string") {
      query.userId = req.query.userId;
    }

    if (typeof req.query.moduleId === "string") {
      query.moduleId = req.query.moduleId;
    }

    if (req.query.isCompleted === "true" || req.query.isCompleted === "false") {
      query.isCompleted = req.query.isCompleted === "true";
    }

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await moduleProgressService.getAllModuleProgress(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Module progress records retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const moduleProgressController = {
  getMyModuleProgress,

  recalculateMyModuleProgress,

  getMyAllModuleProgress,

  getUserModuleProgress,

  getAllModuleProgress,
};
