import { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import { courseModuleService } from "./course.module.service";
import { uploadThumbnailToCloudinary } from "../../utility/cloudinaryMedia";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  if (!req.user) {
    const error = new Error("Authentication required") as Error & {
      statusCode?: number;
    };

    error.statusCode = 401;
    throw error;
  }

  const authUser = req.user as any;

  const userId = authUser.id || authUser.userId;

  if (!userId) {
    const error = new Error("Authenticated user ID is missing") as Error & {
      statusCode?: number;
    };

    error.statusCode = 401;
    throw error;
  }

  return {
    id: String(userId),
    role: String(authUser.role),
  };
};

const createCourseModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    let thumbnailUrl;

    if (req.file) {
      thumbnailUrl = await uploadThumbnailToCloudinary(
        req.file,
        "invictus/courses",
      );
    }

    const result = await courseModuleService.createCourseModule(
      {
        ...req.body,

        thumbnailUrl,
      },

      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,

      success: true,

      message: "Course module created successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCourseModules = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.getAllCourseModules({
      actorRole: authUser.role,

      pillarId:
        typeof req.query.pillarId === "string" ? req.query.pillarId : undefined,

      includeArchived: req.query.includeArchived === "true",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course modules retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getModulesByPillar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.getModulesByPillar(
      String(req.params.pillarId),
      authUser.role,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pillar modules retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleCourseModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.getSingleCourseModule(
      String(req.params.id),
      authUser.role,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateCourseModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    let thumbnailUrl;

    if (req.file) {
      thumbnailUrl = await uploadThumbnailToCloudinary(
        req.file,

        "invictus/courses",
      );
    }

    const result = await courseModuleService.updateCourseModule(
      String(req.params.id),

      {
        ...req.body,

        ...(thumbnailUrl && {
          thumbnailUrl,
        }),
      },

      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,

      success: true,

      message: "Course module updated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishCourseModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.publishCourseModule(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveCourseModuleToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.moveCourseModuleToDraft(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module moved to draft successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archiveCourseModule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await courseModuleService.archiveCourseModule(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const courseModuleController = {
  createCourseModule,

  getAllCourseModules,
  getModulesByPillar,
  getSingleCourseModule,

  updateCourseModule,

  publishCourseModule,
  moveCourseModuleToDraft,
  archiveCourseModule,
};
