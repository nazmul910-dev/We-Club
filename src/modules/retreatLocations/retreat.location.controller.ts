import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import {
  ICreateRetreatLocation,
  IRetreatLocationQuery,
  IUpdateRetreatLocation,
} from "./retreat.location.interface";
import { retreatLocationService } from "./retreat.location.service";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const createRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const location = await retreatLocationService.createRetreatLocation(
      req.body as ICreateRetreatLocation,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Retreat location created successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRetreatLocations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly = !req.user || (req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager");

    const result = await retreatLocationService.getAllRetreatLocations(
      req.query as IRetreatLocationQuery,
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat locations retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly = !req.user || (req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager");

    const location = await retreatLocationService.getSingleRetreatLocation(
      String(req.params.idOrSlug),
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location retrieved successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const updateRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const location = await retreatLocationService.updateRetreatLocation(
      String(req.params.id),
      req.body as IUpdateRetreatLocation,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat location updated successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRetreatLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await retreatLocationService.deleteRetreatLocation(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const retreatLocationController = {
  createRetreatLocation,
  getAllRetreatLocations,
  getSingleRetreatLocation,
  updateRetreatLocation,
  deleteRetreatLocation,
};
