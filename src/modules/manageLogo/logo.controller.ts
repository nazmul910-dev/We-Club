import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../utility/errorResponses";
import sendResponse from "../../utility/sendResponse";
import { logoService } from "./logo.service";

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (typeof req.user.id !== "string") {
    throw new UnauthorizedError("Invalid authenticated user");
  }

  return req.user.id;
};

const logoUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const file = req.file;

    if (!file) {
      throwError("Logo image is required", 400);
    }

    const result = await logoService.uploadLogoIntoDB(userId, file as Express.Multer.File);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logo uploaded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await logoService.getLogoFromDB();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logo retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const changeLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const file = req.file;

    if (!file) {
      throwError("Logo image is required", 400);
    }

    const result = await logoService.changeLogoIntoDB(userId, file as Express.Multer.File);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logo changed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logoController = { logoUpload, getLogo, changeLogo };