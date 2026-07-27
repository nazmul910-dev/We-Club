import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import { quizQuestionService } from "./quiz.question.service";

const throwControllerError = (message: string, status: number): never => {
  const error = new Error(message) as any;
  error.status = status;
  throw error;
};

const getAuthUser = (
  req: Request
): {
  id: string;
  role: string;
} => {
  const user = req.user;

  if (!user) {
    return throwControllerError("Authentication required", 401);
  }

  return {
    id: user.id as string,
    role: user.role as string,
  };
};

const createQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizQuestionService
        .createQuizQuestion(
          String(
            req.params.moduleId
          ),
          req.body,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message:
        "Quiz question created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllQuizQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const moduleId =
      typeof req.query.moduleId ===
      "string"
        ? req.query.moduleId
        : undefined;

    const result =
      await quizQuestionService
        .getAllQuizQuestions({
          actorRole:
            authUser.role,

          ...(moduleId !== undefined
            ? { moduleId }
            : {}),

          includeArchived:
            req.query
              .includeArchived ===
            "true",
        });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Quiz questions retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getQuestionsByModule =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await quizQuestionService
          .getQuestionsByModule(
            String(
              req.params.moduleId
            ),
            authUser.role
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Module quiz questions retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const getSingleQuizQuestion =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await quizQuestionService
          .getSingleQuizQuestion(
            String(req.params.id),
            authUser.role
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Quiz question retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const updateQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizQuestionService
        .updateQuizQuestion(
          String(req.params.id),
          req.body,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Quiz question updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizQuestionService
        .publishQuizQuestion(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Quiz question published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveQuizQuestionToDraft =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await quizQuestionService
          .moveQuizQuestionToDraft(
            String(req.params.id),
            authUser.id
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Quiz question moved to draft successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const archiveQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await quizQuestionService
        .archiveQuizQuestion(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Quiz question archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const quizQuestionController = {
  createQuizQuestion,

  getAllQuizQuestions,
  getQuestionsByModule,
  getSingleQuizQuestion,

  updateQuizQuestion,

  publishQuizQuestion,
  moveQuizQuestionToDraft,
  archiveQuizQuestion,
};