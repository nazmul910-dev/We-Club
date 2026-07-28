import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import {
  EntitlementSource,
  EntitlementStatus,
  EntitlementType,
  IGetEntitlementsOptions,
} from "./userEntitlements.interface";

import { userEntitlementService } from "./userEntitlements.service";

const throwControllerError = (message: string, status: number): never => {
  const error = new Error(message) as any;
  error.status = status;
  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwControllerError(message, statusCode);
  }
};

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  const user = req.user;

  assertFound(user, "Authentication required", 401);

  return {
    id: user.id as string,
    role: user.role as string,
  };
};

const grantEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.grantEntitlementByAdmin(
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User entitlement granted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEntitlements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.getMyEntitlements(authUser.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your entitlements retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkPillarAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.checkPillarAccess(
      authUser.id,
      String(req.params.pillarId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.hasAccess
        ? "Pillar access granted"
        : "Pillar purchase is required",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllEntitlements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const options: IGetEntitlementsOptions = {
      page: Number(req.query.page ?? 1),

      limit: Number(req.query.limit ?? 20),
    };

    if (typeof req.query.userId === "string") {
      options.userId = req.query.userId;
    }

    if (typeof req.query.pillarId === "string") {
      options.pillarId = req.query.pillarId;
    }

    if (typeof req.query.entitlementType === "string") {
      options.entitlementType = req.query.entitlementType as EntitlementType;
    }

    if (typeof req.query.source === "string") {
      options.source = req.query.source as EntitlementSource;
    }

    if (typeof req.query.status === "string") {
      options.status = req.query.status as EntitlementStatus;
    }

    const result = await userEntitlementService.getAllEntitlements(options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlements retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await userEntitlementService.getSingleEntitlement(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const revokeEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.revokeEntitlement(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement revoked successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refundEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.refundEntitlement(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement marked as refunded",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const expireEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.expireEntitlement(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement expired successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const reactivateEntitlement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await userEntitlementService.reactivateEntitlement(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User entitlement reactivated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const userEntitlementController = {
  grantEntitlement,

  getMyEntitlements,
  checkPillarAccess,

  getAllEntitlements,
  getSingleEntitlement,

  revokeEntitlement,
  refundEntitlement,
  expireEntitlement,
  reactivateEntitlement,
};
