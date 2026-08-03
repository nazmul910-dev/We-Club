import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utility/sendResponse';
import { UnauthorizedError } from '../../utility/errorResponses';
import { adminService } from './admin.service';
import {
  updateAccountStatusValidation,
  updateApprovalStatusValidation,
  updateLicenseVerificationStatusValidation,
} from './admin.validation';

const updateUserApprovalStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const adminId = req.user.id;

    if (typeof adminId !== 'string') {
      return next(new UnauthorizedError('Invalid authenticated user'));
    }

    const validatedData = updateApprovalStatusValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result = await adminService.updateUserApprovalStatusIntoDB(
      validatedData.params.id,
      validatedData.body,
      adminId
    );
 
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User approval status updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserLicenseVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = updateLicenseVerificationStatusValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result =
      await adminService.updateUserLicenseVerificationStatusIntoDB(
        validatedData.params.id,
        validatedData.body
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User license verification status updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserAccountStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = updateAccountStatusValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result = await adminService.updateUserAccountStatusIntoDB(
      validatedData.params.id,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User account status updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};



const userDeleteByFounder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;

    const result = await adminService.deleteUserIntoDB(userId as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const adminController = {
  updateUserApprovalStatus,
  updateUserLicenseVerificationStatus,
  updateUserAccountStatus,
  userDeleteByFounder,
}; 