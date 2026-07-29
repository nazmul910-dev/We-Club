import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import {
  IQuizAttemptAdminQuery,
  ISubmitQuizAttempt,
} from "./quiz.attempt.interface";

import { quizAttemptService } from "./quiz.attempt.service";
import assertFound from "../../utility/assertFound";

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

const getAuthUser = (
  req: Request
): {
  id: string;
  role: string;
} => {
  
    assertFound(req.user,"Authentication required",401)

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const submitQuizAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizAttemptService
        .submitQuizAttempt(
          authUser.id,

          String(
            req.params.moduleId
          ),

          req.body as
            ISubmitQuizAttempt
        );

    sendResponse(res, {
      statusCode: 201,
      success: true,

      message: result.passed
        ? "Quiz passed successfully"
        : result.attemptNumber < 2
          ? "Quiz submitted. One retake remains"
          : "Quiz submitted. Maximum attempts used",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyModuleAttempts =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await quizAttemptService
          .getMyModuleAttempts(
            authUser.id,

            String(
              req.params.moduleId
            )
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,

        message:
          "Quiz attempts retrieved successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const getMySingleAttempt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizAttemptService
        .getMySingleAttempt(
          authUser.id,

          String(
            req.params.attemptId
          )
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        "Quiz attempt retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleAttemptAdmin =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      getAuthUser(req);

      const result =
        await quizAttemptService
          .getSingleAttemptAdmin(
            String(
              req.params.id
            )
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,

        message:
          "Quiz attempt retrieved successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const getAllQuizAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    getAuthUser(req);

    const query:
      IQuizAttemptAdminQuery = {};

    if (
      typeof req.query.userId ===
      "string"
    ) {
      query.userId =
        req.query.userId;
    }

    if (
      typeof req.query.moduleId ===
      "string"
    ) {
      query.moduleId =
        req.query.moduleId;
    }

    if (
      req.query.passed === "true" ||
      req.query.passed === "false"
    ) {
      query.passed =
        req.query.passed ===
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
      await quizAttemptService
        .getAllQuizAttempts(
          query
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        "Quiz attempts retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const quizAttemptController = {
  submitQuizAttempt,

  getMyModuleAttempts,
  getMySingleAttempt,

  getSingleAttemptAdmin,
  getAllQuizAttempts,
};