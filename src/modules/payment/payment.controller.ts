import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utility/sendResponse';
import { UnauthorizedError } from '../../utility/errorResponses';
import { paymentService } from './payment.service';
import {
  createUpgradeCheckoutValidation,
  paymentRolePricingValidation,
  verifyCheckoutSessionValidation,
} from './payment.validation';

const getAuthUserId = (req: Request): any => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  return req.user.id;
};

const getAllPricingPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = paymentService.getAllPricingPlans();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Pricing plans retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPricingPlanByRoleAndAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = paymentRolePricingValidation.parse({
      params: req.params,
    });

    const result = paymentService.getPricingPlanByRoleAndAccess(
      validatedData.params.role,
      validatedData.params.accessTo
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Pricing plan retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createUpgradeCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getAuthUserId(req);

    const validatedData = createUpgradeCheckoutValidation.parse({
      body: req.body,
    });

    const result =
      await paymentService.createUpgradeCheckoutSessionIntoStripe(
        userId,
        validatedData.body?.discountCode
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Stripe checkout session created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = verifyCheckoutSessionValidation.parse({
      params: req.params,
    });

    const result = await paymentService.verifyCheckoutSessionFromStripe(
      validatedData.params.sessionId
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const stripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['stripe-signature'];

    await paymentService.handleStripeWebhook(req.body as Buffer, signature);

    res.status(200).json({
      received: true,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentController = {
  getAllPricingPlans,
  getPricingPlanByRoleAndAccess,
  createUpgradeCheckout,
  verifyCheckoutSession,
  stripeWebhook,
};