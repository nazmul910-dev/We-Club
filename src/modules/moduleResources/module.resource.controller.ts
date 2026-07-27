import type { NextFunction, Request, Response } from "express";

import { getUploadedFieldFile } from "../../middleware/mediaUploadMiddleware";
import {
  uploadResourceToCloudinary,
  uploadThumbnailToCloudinary,
} from "../../utility/cloudinaryMedia";
import sendResponse from "../../utility/sendResponse";
import { UnauthorizedError } from "../../utility/errorResponses";
import type {
  ICreateModuleResource,
  ICreateModuleResourceInput,
} from "./module.resource.interface";
import { moduleResourceService } from "./module.resource.service";

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

const createModuleResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);
    const moduleId = String(req.params.moduleId);
    const body = req.body as ICreateModuleResourceInput;

    const payload: ICreateModuleResource = {
      title: body.title,
      slug: body.slug,
      resourceType: body.resourceType,
      provider: body.provider,
      isRequired: body.isRequired ?? true,
      pointsReward: body.pointsReward ?? 5,
      order: body.order,
    };

    if (body.description !== undefined) {
      payload.description = body.description;
    }

    if (body.externalUrl !== undefined) {
      payload.externalUrl = body.externalUrl;
    }

    if (body.provider === "cloudinary") {
      const resourceFile = getUploadedFieldFile(req, "resource");
      const thumbnailFile = getUploadedFieldFile(req, "thumbnail");

      if (!resourceFile) {
        throwControllerError(
          'Cloudinary resource requires a file in multipart field "resource"',
          400
        );
      }

      const uploadedResource = await uploadResourceToCloudinary(
        resourceFile,
        `invictus/module-resources/${moduleId}`
      );

      payload.fileName = uploadedResource.fileName;
      payload.mimeType = uploadedResource.mimeType;
      payload.cloudinaryPublicId = uploadedResource.cloudinaryPublicId;
      payload.cloudinaryResourceType =
        uploadedResource.cloudinaryResourceType;
      payload.secureUrl = uploadedResource.secureUrl;

      if (uploadedResource.cloudinaryAssetId !== undefined) {
        payload.cloudinaryAssetId = uploadedResource.cloudinaryAssetId;
      }

      if (uploadedResource.format !== undefined) {
        payload.format = uploadedResource.format;
      }

      if (uploadedResource.bytes !== undefined) {
        payload.bytes = uploadedResource.bytes;
      }

      if (thumbnailFile) {
        payload.thumbnailUrl = await uploadThumbnailToCloudinary(
          thumbnailFile,
          `invictus/module-resources/${moduleId}/thumbnails`
        );
      } else if (uploadedResource.thumbnailUrl !== undefined) {
        payload.thumbnailUrl = uploadedResource.thumbnailUrl;
      }
    }

    const result = await moduleResourceService.createModuleResource(
      moduleId,
      payload,
      authUser.id
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Module resource uploaded and created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllModuleResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.getAllModuleResources({
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
      message: "Module resources retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getResourcesByModule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.getResourcesByModule(
      String(req.params.moduleId),
      authUser.role
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course module resources retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleModuleResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.getSingleModuleResource(
      String(req.params.id),
      authUser.role
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module resource retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateModuleResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.updateModuleResource(
      String(req.params.id),
      req.body,
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module resource updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishModuleResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.publishModuleResource(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module resource published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveModuleResourceToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.moveModuleResourceToDraft(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module resource moved to draft successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archiveModuleResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await moduleResourceService.archiveModuleResource(
      String(req.params.id),
      authUser.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Module resource archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const moduleResourceController = {
  createModuleResource,
  getAllModuleResources,
  getResourcesByModule,
  getSingleModuleResource,
  updateModuleResource,
  publishModuleResource,
  moveModuleResourceToDraft,
  archiveModuleResource,
};
