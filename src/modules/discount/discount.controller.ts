import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utility/sendResponse';
import { UnauthorizedError } from '../../utility/errorResponses';
import { discountService } from './discount.service';
import {
  createDiscountCodeValidation,
  sendDiscountCodeEmailValidation,
  validateDiscountCodeValidation,
} from './discount.validation';

const getAuthUserId = (req: Request): any => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  return req.user.id;
};

const createDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = getAuthUserId(req);

    const validatedData = createDiscountCodeValidation.parse({
      body: req.body,
    });
 
    const result = await discountService.createDiscountCodeIntoDB(
      validatedData.body,
      adminId
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Discount code created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllDiscountCodes = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await discountService.getAllDiscountCodesFromDB();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Discount codes retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const validateDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = validateDiscountCodeValidation.parse({
      query: req.query,
    });

    const result = await discountService.validateDiscountCodeForCheckout({
      code: validatedData.query.code,
      role: validatedData.query.role,
      accessTo: validatedData.query.accessTo,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Discount code is valid',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const sendDiscountCodeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sendDiscountCodeEmailValidation.parse({
      body: req.body,
    });

    const result = await discountService.sendDiscountCodeByEmail(
      validatedData.body.email,
      validatedData.body.code
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Discount code email sent successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    if (!id) {
      throw new Error('Discount code ID is required');
    }

    const result = await discountService.deleteDiscountCodeFromDB(id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Discount code deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const discountController = {
  createDiscountCode,
  getAllDiscountCodes,
  validateDiscountCode,
  sendDiscountCodeEmail,
  deleteDiscountCode,
};