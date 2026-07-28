import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../utility/errorResponses';
import sendResponse from '../../utility/sendResponse';
import { profileService } from './profile.service';
import {
  deleteSocialLinkValidation,
  updateBasicProfileValidation,
  updateBioValidation,
  updateMarketingChannelsValidation,
  upsertSocialLinkValidation,
} from './profile.validation';

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (typeof req.user.id !== 'string') {
    throw new UnauthorizedError('Invalid authenticated user');
  }

  return req.user.id;
};

const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await profileService.getMyProfileFromDB(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBasicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const validatedData = updateBasicProfileValidation.parse({
      body: req.body,
    });

    const result = await profileService.updateBasicProfileIntoDB(
      userId,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Basic profile updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateBio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const validatedData = updateBioValidation.parse({
      body: req.body,
    });

    const result = await profileService.updateBioIntoDB(
      userId,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Bio updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const upsertSocialLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const validatedData = upsertSocialLinkValidation.parse({
      body: req.body,
    });

    const result = await profileService.upsertSocialLinkIntoDB(
      userId,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Social link saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSocialLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const validatedData = deleteSocialLinkValidation.parse({
      params: req.params,
    });

    const result = await profileService.deleteSocialLinkFromDB(
      userId,
      validatedData.params.platform
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Social link deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateMarketingChannels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const validatedData = updateMarketingChannelsValidation.parse({
      body: req.body,
    });

    const result = await profileService.updateMarketingChannelsIntoDB(
      userId,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Marketing channels updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction 
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const file = req.file;

    if (!file) {
      throwError('Profile image is required', 400);
    }

    const result = await profileService.updateProfileImageIntoDB(userId, file as Express.Multer.File);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile image updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await profileService.deleteProfileImageFromDB(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile image deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const profileController = {
  getMyProfile,
  updateBasicProfile,
  updateBio,
  upsertSocialLink,
  deleteSocialLink,
  updateMarketingChannels,
  updateProfileImage,
  deleteProfileImage,
};