import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../utility/errorResponses';
import sendResponse from '../../utility/sendResponse';
import { listingAssetsService } from './listing.assets.service';
import {
  downloadListingAssetsValidation,
  listingAssetLogsValidation,
} from './listing.assets.validation';

const getAuthUser = (req: Request) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (typeof req.user.id !== 'string') {
    throw new UnauthorizedError('Invalid authenticated user');
  }

  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  };
};

const downloadListingAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = downloadListingAssetsValidation.parse({
      params: req.params,
    });

    const result = await listingAssetsService.downloadListingAssetsZipFromDB(
      validatedData.params.listingId,
      authUser,
      {
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      }
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`
    );

    result.archive.on('error', (error:any) => {
      next(error);
    });

    result.archive.pipe(res);

    await result.archive.finalize();
  } catch (error) {
    next(error);
  }
};

const getListingAssetLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = listingAssetLogsValidation.parse({
      params: req.params,
    });

    const result = await listingAssetsService.getListingAssetLogsFromDB(
      validatedData.params.listingId,
      authUser
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Listing asset download logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllListingAssetLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result =
      await listingAssetsService.getAllListingAssetLogsFromDB(authUser);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'All listing asset download logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listingAssetsController = {
  downloadListingAssets,
  getListingAssetLogs,
  getAllListingAssetLogs,
};