import type {
  NextFunction,
  Request,
  Response,
} from "express";

import sendResponse from "../../utility/sendResponse";

import { invictusPaymentService } from "./invictus.payment.service";

const throwControllerError = (
  message: string,
  status: number
): never => {
  const error = new Error(
    message
  ) as any;

  error.status = status;

  throw error;
};

const getAuthUser = (
  req: Request
): {
  id: string;
  fullName: string;
  email: string;
} => {
  const user = req.user;

  if (!user) {
    return throwControllerError(
      "Authentication required",
      401
    );
  }

  return {
    id: user.id as string,
    fullName:
      (user as any).fullName ?? "",
    email: user.email as string,
  };
};

const createInvictusCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await invictusPaymentService.createInvictusCheckoutSession(
        {
          userId: authUser.id,
          fullName: authUser.fullName,
          email: authUser.email,
          input: req.body,
        }
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Checkout session created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyInvictusPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser =
      getAuthUser(req);

    const result =
      await invictusPaymentService.getMyInvictusPurchases(
        authUser.id
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Your INVICTUS purchases retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const invictusPaymentController = {
  createInvictusCheckoutSession,
  getMyInvictusPurchases,
};
