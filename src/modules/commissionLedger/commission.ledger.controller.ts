import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utility/sendResponse';
import { UnauthorizedError } from '../../utility/errorResponses';
import { commissionLedgerService } from './commission.ledger.service';
import {
  commissionIdValidation,
  confirmCommissionReceivedValidation,
  confirmCommissionValidation,
  createManualCommissionValidation,
  disputeCommissionValidation,
  markCommissionPaidValidation,
  resolveDisputeValidation,
} from './commission.ledger.validation';

const getAuthUser = (req: Request) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (typeof req.user.id !== 'string') {
    throw new UnauthorizedError('Invalid authenticated user');
  }

  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  };
};

const getMyCommissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await commissionLedgerService.getMyCommissionsFromDB(
      authUser,
      req.query
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'My commission records retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCommissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await commissionLedgerService.getAllCommissionsFromDB(
      req.query
    );


    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission records retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleCommission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = commissionIdValidation.parse({
      params: req.params,
    });

    const result = await commissionLedgerService.getSingleCommissionFromDB(
      validatedData.params.id,
      authUser
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission record retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createManualCommission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = createManualCommissionValidation.parse({
      body: req.body,
    });

    const result = await commissionLedgerService.createManualCommissionIntoDB(
      authUser,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Manual commission record created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const confirmCommission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = confirmCommissionValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result = await commissionLedgerService.confirmCommissionIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission confirmed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markCommissionPaid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = markCommissionPaidValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result = await commissionLedgerService.markCommissionPaidIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission marked as paid successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const confirmCommissionReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = confirmCommissionReceivedValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result =
      await commissionLedgerService.confirmCommissionReceivedIntoDB(
        validatedData.params.id,
        authUser,
        validatedData.body
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission payment received confirmation saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const disputeCommission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = disputeCommissionValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result = await commissionLedgerService.disputeCommissionIntoDB(
      validatedData.params.id,
      authUser,
      validatedData.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission disputed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resolveCommissionDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = getAuthUser(req);

    const validatedData = resolveDisputeValidation.parse({
      params: req.params,
      body: req.body,
    });

    const result =
      await commissionLedgerService.resolveCommissionDisputeIntoDB(
        validatedData.params.id,
        authUser,
        validatedData.body
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Commission dispute resolved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const commissionLedgerController = {
  getMyCommissions,
  getAllCommissions,
  getSingleCommission,
  createManualCommission,
  confirmCommission,
  markCommissionPaid,
  confirmCommissionReceived,
  disputeCommission,
  resolveCommissionDispute,
};