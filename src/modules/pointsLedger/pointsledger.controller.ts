import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import { ICreatePointsLedgerInput, IPointsLedgerQuery } from "./pointsledger.interface";
import { pointsLedgerService } from "./pointsledger.service";

const getAuthUser = (req: Request) => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const createPointsLedger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const payload: ICreatePointsLedgerInput = req.body as ICreatePointsLedgerInput;
    const result = await pointsLedgerService.createPointsLedger(payload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Points ledger entry created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPointsLedger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IPointsLedgerQuery = {};

    if (typeof req.query.userId === "string") query.userId = req.query.userId;
    if (typeof req.query.sourceType === "string") query.sourceType = req.query.sourceType as never;
    if (typeof req.query.sourceEntity === "string") query.sourceEntity = req.query.sourceEntity;
    if (typeof req.query.reason === "string") query.reason = req.query.reason as never;
    if (typeof req.query.transactionType === "string") query.transactionType = req.query.transactionType as never;
    if (typeof req.query.page === "string") query.page = Number(req.query.page);
    if (typeof req.query.limit === "string") query.limit = Number(req.query.limit);

    const result = await pointsLedgerService.getPointsLedger(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Points ledger retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSinglePointsLedger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await pointsLedgerService.getSinglePointsLedger(String(req.params.id));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Points ledger entry retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const pointsLedgerController = {
  createPointsLedger,
  getPointsLedger,
  getSinglePointsLedger,
};
