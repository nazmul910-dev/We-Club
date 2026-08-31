import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import { UnauthorizedError } from "../../utility/errorResponses";
import { uploadVideoToCloudinary } from "../../utility/cloudinaryMedia";
import type {
  ICreateModuleVideo,
  ICreateModuleVideoInput,
} from "./module.video.interface";
import { moduleVideoService } from "./module.video.service";

const getAuthUser = (req: Request): { id: string; role: string } => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  return {
    id: String(req.user.id),
    role: String(req.user.role),
  };
};

const throwControllerError = (
  message: string,
  statusCode: number
): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;
  throw error;
};

const createModuleVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const moduleId = String(
      req.params.moduleId
    );

    const videoFile = req.file;

    if (!videoFile) {
      throwControllerError(
        'Video file is required in multipart field "video"',
        400
      );
    }

    const body =
      req.body as ICreateModuleVideoInput;

    const uploaded =
      await uploadVideoToCloudinary(
        videoFile,
        `invictus/module-videos/${moduleId}`
      );

    const payload: ICreateModuleVideo = {
      title: body.title,
      slug: body.slug,

      cloudinaryPublicId:
        uploaded.cloudinaryPublicId,

      secureUrl: uploaded.secureUrl,

      durationSeconds:
        uploaded.durationSeconds,

      isPaid: body.isPaid ?? false,

      isRequired:
        body.isRequired ?? true,

      requiredWatchPercent:
        body.requiredWatchPercent ?? 80,

      pointsReward:
        body.pointsReward ?? 10,

      order: body.order,

      uploadStatus: "ready",
    };


    if (body.description !== undefined) {
      payload.description =
        body.description;
    }

    if (
      uploaded.cloudinaryAssetId !==
      undefined
    ) {
      payload.cloudinaryAssetId =
        uploaded.cloudinaryAssetId;
    }

    if (
      uploaded.playbackUrl !== undefined
    ) {
      payload.playbackUrl =
        uploaded.playbackUrl;
    }

    if (
      uploaded.thumbnailUrl !== undefined
    ) {
      payload.thumbnailUrl =
        uploaded.thumbnailUrl;
    }

    if (uploaded.folder !== undefined) {
      payload.folder = uploaded.folder;
    }

    if (uploaded.format !== undefined) {
      payload.format = uploaded.format;
    }

    if (uploaded.bytes !== undefined) {
      payload.bytes = uploaded.bytes;
    }

    if (uploaded.width !== undefined) {
      payload.width = uploaded.width;
    }

    if (uploaded.height !== undefined) {
      payload.height = uploaded.height;
    }

    const result =
      await moduleVideoService
        .createModuleVideo(
          moduleId,
          payload,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message:
        "Module video uploaded and created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllModuleVideos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.getAllModuleVideos({
      actorRole: authUser.role,
      moduleId:
        typeof req.query.moduleId === "string"
          ? req.query.moduleId
          : undefined,
      includeArchived: req.query.includeArchived === "true",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module videos retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getVideosByModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.getVideosByModule(
      String(req.params.moduleId),
      authUser.role
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module videos retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleModuleVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.getSingleModuleVideo(
      String(req.params.id),
      authUser.role
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module video retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateModuleVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.updateModuleVideo(
      String(req.params.id),
      req.body,
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module video updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishModuleVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.publishModuleVideo(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module video published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveModuleVideoToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.moveModuleVideoToDraft(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module video moved to draft successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archiveModuleVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleVideoService.archiveModuleVideo(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module video archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const checkVideoAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);
 
    const result = await moduleVideoService.checkVideoAccess(
      String(req.params.id),
      authUser.id
    );
 
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Video access checked successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const moduleVideoController = {
  createModuleVideo,
  getAllModuleVideos,
  getVideosByModule,
  getSingleModuleVideo,
  updateModuleVideo,
  publishModuleVideo,
  moveModuleVideoToDraft,
  archiveModuleVideo,
  checkVideoAccess
};
