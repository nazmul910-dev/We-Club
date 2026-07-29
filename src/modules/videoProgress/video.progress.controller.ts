import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import {
  IRecordVideoHeartbeat,
  IVideoProgressAdminQuery,
} from "./video.progress.interface";

import { videoProgressService } from "./video.progress.service";

const throwControllerError = (
  message: string,
  statusCode: number
): never => {
  const error = new Error(
    message
  ) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};


const assertFound: <T>(
  value: T | null | undefined ,
  message: string,
  statusCode: number,
) => asserts value is T = (value , message,statusCode) =>{
  if (value === null || value === undefined) {
    throwControllerError(message, statusCode);
  }
}

const getAuthUser = (
  req: Request
): {
  id: string;
  role: string;
} => {

  const user = req.user
  assertFound(user,"Authentication required",401)



  return {
    id: user.id as string,   
    role: user.role as string,
  };
};

const recordVideoHeartbeat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const payload =
      req.body as
        IRecordVideoHeartbeat;

    const result =
      await videoProgressService
        .recordVideoHeartbeat(
          authUser.id,

          String(
            req.params.videoId
          ),

          payload
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        result.isCompleted
          ? "Video completed successfully"
          : "Video progress updated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyVideoProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await videoProgressService
        .getMyVideoProgress(
          authUser.id,

          String(
            req.params.videoId
          )
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        "Video progress retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyModuleVideoProgress =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await videoProgressService
          .getMyModuleVideoProgress(
            authUser.id,

            String(
              req.params.moduleId
            )
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,

        message:
          "Module video progress retrieved successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const getMyAllVideoProgress =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await videoProgressService
          .getMyAllVideoProgress(
            authUser.id
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,

        message:
          "Video progress history retrieved successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const getAllVideoProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    getAuthUser(req);

    const query:
      IVideoProgressAdminQuery = {};

    if (
      typeof req.query.userId ===
      "string"
    ) {
      query.userId =
        req.query.userId;
    }

    if (
      typeof req.query.videoId ===
      "string"
    ) {
      query.videoId =
        req.query.videoId;
    }

    if (
      typeof req.query.moduleId ===
      "string"
    ) {
      query.moduleId =
        req.query.moduleId;
    }

    if (
      req.query.isCompleted ===
        "true" ||
      req.query.isCompleted ===
        "false"
    ) {
      query.isCompleted =
        req.query.isCompleted ===
        "true";
    }

    if (
      typeof req.query.page ===
      "string"
    ) {
      query.page =
        Number(req.query.page);
    }

    if (
      typeof req.query.limit ===
      "string"
    ) {
      query.limit =
        Number(req.query.limit);
    }

    const result =
      await videoProgressService
        .getAllVideoProgress(
          query
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        "All video progress records retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const videoProgressController = {
  recordVideoHeartbeat,

  getMyVideoProgress,

  getMyModuleVideoProgress,

  getMyAllVideoProgress,

  getAllVideoProgress,
};