import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import {
  ICancelRetreatBooking,
  IConfirmRetreatBookingAdmin,
  ICreateRetreatBooking,
  IInviteRetreatBooking,
  IRefundRetreatBooking,
  IRetreatBookingQuery,
  IUpdateRetreatBooking,
} from "./retreat.booking.interface";
import { retreatBookingService } from "./retreat.booking.service";

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

const createRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.createRetreatBooking(
      req.body as ICreateRetreatBooking,
      authUser.id,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Retreat reservation / waitlist request submitted successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await retreatBookingService.createRetreatBookingCheckoutSession({
      bookingId: String(req.params.id),
      userId: authUser.id,
      successUrl: req.body?.successUrl,
      cancelUrl: req.body?.cancelUrl,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Stripe checkout session created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = (req.body?.sessionId || req.query.sessionId) as string;

    const result = await retreatBookingService.verifyRetreatBookingPayment(sessionId);

    sendResponse(res, {
      statusCode: 200,
      success: result.paid,
      message: result.message,
      data: result.booking ?? null,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRetreatBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await retreatBookingService.getMyRetreatBookings(
      authUser.id,
      req.query as IRetreatBookingQuery,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "My retreat bookings retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMySingleRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.getMySingleRetreatBooking(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const updateRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.updateRetreatBooking({
      bookingId: String(req.params.id),
      payload: req.body as IUpdateRetreatBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking details updated successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const cancelRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.cancelRetreatBooking({
      bookingId: String(req.params.id),
      payload: req.body as ICancelRetreatBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const inviteRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.inviteRetreatBooking(
      String(req.params.id),
      req.body as IInviteRetreatBooking,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Member invited to retreat batch successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const confirmRetreatBookingAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.confirmRetreatBookingAdmin(
      String(req.params.id),
      req.body as IConfirmRetreatBookingAdmin,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking confirmed by administrator",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const refundRetreatBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await retreatBookingService.refundRetreatBooking(
      String(req.params.id),
      req.body as IRefundRetreatBooking,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking marked as refunded",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRetreatBookingsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await retreatBookingService.getAllRetreatBookingsAdmin(
      req.query as IRetreatBookingQuery,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All retreat bookings retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleRetreatBookingAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const booking = await retreatBookingService.getSingleRetreatBookingAdmin(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Retreat booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const retreatBookingController = {
  createRetreatBooking,
  createCheckoutSession,
  verifyPayment,
  getMyRetreatBookings,
  getMySingleRetreatBooking,
  updateRetreatBooking,
  cancelRetreatBooking,
  inviteRetreatBooking,
  confirmRetreatBookingAdmin,
  refundRetreatBooking,
  getAllRetreatBookingsAdmin,
  getSingleRetreatBookingAdmin,
};
