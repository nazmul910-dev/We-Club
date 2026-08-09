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
        validatedData.body.durationMonths,
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



const getRegistrationPaymentDetails =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token =
        req.params.token;

      if (!token) {
        throw new Error(
          'Payment token is required'
        );
      }

      const result =
        await paymentService
          .getRegistrationPaymentDetails(
            token as string
          );

      sendResponse(res, {
        statusCode: 200,

        success: true,

        message:
          'Registration payment details retrieved successfully',

        data: result,
      });

    } catch (error) {
      next(error);
    }
  };


  const createRegistrationCheckout =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token =
        req.params.token;

      if (!token) {
        throw new Error(
          'Payment token is required'
        );
      }

      const result =
        await paymentService
          .createRegistrationCheckoutByToken(
            token as string,
            req.body?.discountCode
          );

      sendResponse(res, {
        statusCode: 200,

        success: true,

        message:
          'Stripe checkout session created successfully',

        data: result,
      });

    } catch (error) {
      next(error);
    }
  };

  const getPendingRegistrationPayments =
  async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {

      const result =
        await paymentService
          .getPendingRegistrationPayments();

      sendResponse(res, {
        statusCode: 200,

        success: true,

        message:
          'Pending registration payments retrieved successfully',

        data: result,
      });

    } catch (error) {
      next(error);
    }
  };


  const getMyUpgradePlans =
async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId =
      getAuthUserId(req);

    const result =
      await paymentService
        .getMyUpgradePlans(
          userId
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message:
        'Upgrade plans retrieved successfully',

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};


const sendRegistrationPaymentLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const linkId = req.params.linkId;

    if (!linkId) {
      throw new Error('Payment link ID is required');
    }

    const result =
      await paymentService.sendRegistrationPaymentLinkEmail(linkId as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Payment link sent to user successfully',
      data: result,
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
getMyUpgradePlans,
  getRegistrationPaymentDetails,
  createRegistrationCheckout,
  getPendingRegistrationPayments,
  sendRegistrationPaymentLink,
};