import { Request, Response, NextFunction } from "express";

import sendResponse from "../../utility/sendResponse";

import { academyProfileService } from "./academy.profile.service";

const getAuthUser = (req: Request) => {
  if (!req.user) throw new Error("Authentication required");

  return req.user;
};

const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = getAuthUser(req);


    const result = await academyProfileService.createProfile(user.id as string, req.body);

    sendResponse(res, {
      statusCode: 201,

      success: true,

      message: "Academy profile created successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = getAuthUser(req);

    const result = await academyProfileService.getMyProfile(user.id as string);

    sendResponse(res, {
      statusCode: 200,

      success: true,

      message: "Academy profile retrieved",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = getAuthUser(req);

    const result = await academyProfileService.updateProfile(user.id as string, req.body);

    sendResponse(res, {
      statusCode: 200,

      success: true,

      message: "Academy profile updated",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProfiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await academyProfileService.getAllProfiles();

    sendResponse(res, {
      statusCode: 200,

      success: true,

      message: "Profiles retrieved",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const academyProfileController = {
  createProfile,

  getMyProfile,

  updateProfile,

  getAllProfiles,
};
