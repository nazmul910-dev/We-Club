import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import {
  ICreateRetreatBatch,
  IRetreatBatchQuery,
  IUpdateRetreatBatch,
} from "./retreat.batch.interface";
import { retreatBatchService } from "./retreat.batch.service";

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

const createRetreatBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const batch = await retreatBatchService.createRetreatBatch(
      req.body as ICreateRetreatBatch,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Retreat batch created successfully",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRetreatBatches = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly = !req.user || (req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager");

    const result = await retreatBatchService.getAllRetreatBatches(
      req.query as IRetreatBatchQuery,
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batches retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleRetreatBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isPublicOnly = !req.user || (req.user.role !== "founder" && req.user.role !== "admin" && req.user.role !== "manager");

    const batch = await retreatBatchService.getSingleRetreatBatch(
      String(req.params.idOrSlug),
      isPublicOnly,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batch retrieved successfully",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

const updateRetreatBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const batch = await retreatBatchService.updateRetreatBatch(
      String(req.params.id),
      req.body as IUpdateRetreatBatch,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat batch updated successfully",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRetreatBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await retreatBatchService.deleteRetreatBatch(
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

export const retreatBatchController = {
  createRetreatBatch,
  getAllRetreatBatches,
  getSingleRetreatBatch,
  updateRetreatBatch,
  deleteRetreatBatch,
};
