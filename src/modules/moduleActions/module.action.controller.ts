import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import { moduleActionService } from "./module.action.service";

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

const createModuleAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await moduleActionService
        .createModuleAction(
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
        "Module action created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllModuleActions = async (
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
      await moduleActionService
        .getAllModuleActions({
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
        "Module actions retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getActionsByModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await moduleActionService
        .getActionsByModule(
          String(
            req.params.moduleId
          ),
          authUser.role
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Module actions retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleModuleAction =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await moduleActionService
          .getSingleModuleAction(
            String(req.params.id),
            authUser.role
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Module action retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const updateModuleAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await moduleActionService
        .updateModuleAction(
          String(req.params.id),
          req.body,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Module action updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishModuleAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await moduleActionService
        .publishModuleAction(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Module action published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveModuleActionToDraft =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authUser =
        getAuthUser(req);

      const result =
        await moduleActionService
          .moveModuleActionToDraft(
            String(req.params.id),
            authUser.id
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Module action moved to draft successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

const archiveModuleAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await moduleActionService
        .archiveModuleAction(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Module action archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const moduleActionController = {
  createModuleAction,

  getAllModuleActions,
  getActionsByModule,
  getSingleModuleAction,

  updateModuleAction,

  publishModuleAction,
  moveModuleActionToDraft,
  archiveModuleAction,
};