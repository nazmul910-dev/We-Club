import { NextFunction, Request, Response } from "express";
import { listingPromoteRequestRoutes } from "./listing.promote.route";
import { listingPromoteRequestService } from "./listing.promote.service";
import sendResponse from "../../utility/sendResponse";
import { UnauthorizedError } from "../../utility/errorResponses";
import { UserRole } from "../users/user.interface";

const createListingPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requesterId = req.user?.id;
    const requesterEmail = req.user?.email;

    const payload = req.body;
    const updatedPayload = {
      ...payload,
      requester: {
        user_id: requesterId,
        email: requesterEmail,
      },
    };

    const result = await listingPromoteRequestService.createPromoteRequestInDB(
      requesterId as string,
      updatedPayload,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Listing Promote Request created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllListingPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query;
    const result =
      await listingPromoteRequestService.getAllListingPromoteRequest(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Listing Promote Request retrived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// this controller helps to get the promote request for a asssociate like however posted a promote request on a associate listings will show here
const getMyListingsPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const associate_id = req.user?.id;

    const query = req.query;
    const result =
      await listingPromoteRequestService.getMyListingsPromoteRequestFromDB(
        associate_id as string,
        query,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Sucessfully fatched your listings",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// this helps to retrived a promoter request whoever  requested in a listing or multiple listing
const getMyPromoteRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requesterId = req.user?.id;

    const query = req.query;
    const result =
      await listingPromoteRequestService.getMyPromoteRequestsFromDB(
        requesterId as string,
        query,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Your promote requests retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cencelPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    const result = await listingPromoteRequestService.cancelPromoteRequestInDB(
      id as string,
      requesterId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Promote request cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const manageListingPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params; // promote request ID
    const payload = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;
    const isAdmin = req.user?.role === "admin";

    if (!payload.status || !["approved", "rejected"].includes(payload.status)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "status must be either 'approved' or 'rejected'",
        data: null,
      });
    }

    const result = await listingPromoteRequestService.managePromoteRequestInDB(
      id as string,
      {
        id: userId as string,
        role: role as UserRole,
      },
      payload,
    );

    res.status(200).json({
      success: true,
      message: `Promote request ${payload.status} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deletePromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;

    const result = await listingPromoteRequestService.deletePromoteRequest(
      id as string,
      role as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Deleted Promote Request successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listingPromoteRequestController = {
  createListingPromoteRequest,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequest,
  manageListingPromoteRequest,
  getMyPromoteRequests,
  cencelPromoteRequest,
  deletePromoteRequest,
};
