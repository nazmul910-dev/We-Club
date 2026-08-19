import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import {
  ICancelMentorBooking,
  ICompleteMentorBooking,
  IConfirmMentorBooking,
  ICreateMentorBooking,
  IMentorBookingQuery,
  INoShowMentorBooking,
  IUpdateMentorBooking,
} from "./mentor.booking.interface";

import { mentorBookingService } from "./mentor.booking.service";

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

const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.createBooking(
      req.body as ICreateMentorBooking,
      authUser.id,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Mentor booking requested successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMemberBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await mentorBookingService.getMyMemberBookings(
      authUser.id,
      req.query as IMentorBookingQuery,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Member bookings retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMemberSingleBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.getMyMemberSingleBooking(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Member booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMentorBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await mentorBookingService.getMyMentorBookings(
      authUser.id,
      req.query as IMentorBookingQuery,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor schedule retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMentorSingleBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.getMyMentorSingleBooking(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBookingsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await mentorBookingService.getAllBookingsAdmin(
      req.query as IMentorBookingQuery,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All mentor bookings retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleBookingAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const booking = await mentorBookingService.getSingleBookingAdmin(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.updateBooking({
      bookingId: String(req.params.id),
      payload: req.body as IUpdateMentorBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking updated successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.confirmBooking({
      bookingId: String(req.params.id),
      payload: req.body as IConfirmMentorBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking confirmed successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.cancelBooking({
      bookingId: String(req.params.id),
      payload: req.body as ICancelMentorBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const completeBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.completeBooking({
      bookingId: String(req.params.id),
      payload: req.body as ICompleteMentorBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking marked as completed successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const markNoShowBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const booking = await mentorBookingService.markNoShowBooking({
      bookingId: String(req.params.id),
      payload: req.body as INoShowMentorBooking,
      actorId: authUser.id,
      actorRole: authUser.role,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor booking marked as no-show successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const mentorBookingController = {
  createBooking,
  getMyMemberBookings,
  getMyMemberSingleBooking,
  getMyMentorBookings,
  getMyMentorSingleBooking,
  getAllBookingsAdmin,
  getSingleBookingAdmin,
  updateBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShowBooking,
};
