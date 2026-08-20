import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import { paymentPlanService } from "./payment.plan.service";

const throwControllerError = (message: string, status: number): never => {
  const error = new Error(message) as any;
  error.status = status;
  throw error;
};

const getAuthUser = (
  req: Request
): {
  id: string;
  role: string;
} => {
  const user = req.user;

  if (!user) {
    return throwControllerError("Authentication required", 401);
  }

  return {
    id: user.id as string,
    role: user.role as string,
  };
};

const createPaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await paymentPlanService
        .createPaymentPlan(
          req.body,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message:
        "Payment plan created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPaymentPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productType =
      typeof req.query.productType ===
      "string"
        ? req.query.productType
        : undefined;

    const mode =
      typeof req.query.mode ===
      "string"
        ? req.query.mode
        : undefined;

    const status =
      typeof req.query.status ===
      "string"
        ? req.query.status
        : undefined;

    const result =
      await paymentPlanService
        .getAllPaymentPlans({
          productType,
          mode,
          status,
          includeArchived:
            req.query
              .includeArchived ===
            "true",
        });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plans retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSinglePaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await paymentPlanService
        .getSinglePaymentPlan(
          String(req.params.id)
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentPlanBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await paymentPlanService
        .getPaymentPlanBySlug(
          String(req.params.slug)
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await paymentPlanService
        .updatePaymentPlan(
          String(req.params.id),
          req.body,
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const activatePaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await paymentPlanService
        .activatePaymentPlan(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan activated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deactivatePaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await paymentPlanService
        .deactivatePaymentPlan(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan moved to draft successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archivePaymentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await paymentPlanService
        .archivePaymentPlan(
          String(req.params.id),
          authUser.id
        );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Payment plan archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentPlanController = {
  createPaymentPlan,

  getAllPaymentPlans,
  getSinglePaymentPlan,
  getPaymentPlanBySlug,

  updatePaymentPlan,

  activatePaymentPlan,
  deactivatePaymentPlan,
  archivePaymentPlan,
};
