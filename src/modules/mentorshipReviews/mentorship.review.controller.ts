import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import {
  ICreateMentorshipReview,
  IMentorshipReviewQuery,
  IModerateMentorshipReview,
  IUpdateMentorshipReview,
} from "./mentorship.review.interface";

import { mentorshipReviewService } from "./mentorship.review.service";

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

const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const review = await mentorshipReviewService.createReview(
      req.body as ICreateMentorshipReview,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Mentorship review submitted successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsForMentor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mentorId = String(req.params.mentorId);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await mentorshipReviewService.getReviewsForMentor(mentorId, {
      page,
      limit,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentor reviews retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await mentorshipReviewService.getMyReviews(authUser.id, {
      page,
      limit,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "My mentorship reviews retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviewId = String(req.params.id);
    const actorUserId = req.user?.id as string | undefined;
    const actorRole = req.user?.role as string | undefined;

    const review = await mentorshipReviewService.getSingleReview(
      reviewId,
      actorUserId,
      actorRole,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review retrieved successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const reviewId = String(req.params.id);

    const review = await mentorshipReviewService.updateReview(
      reviewId,
      req.body as IUpdateMentorshipReview,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review updated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const reviewId = String(req.params.id);

    const result = await mentorshipReviewService.deleteReview(
      reviewId,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllReviewsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query: IMentorshipReviewQuery = {
      mentor: req.query.mentor as string | undefined,
      user: req.query.user as string | undefined,
      booking: req.query.booking as string | undefined,
      mentorshipProfile: req.query.mentorshipProfile as string | undefined,
      status: req.query.status as any,
      rating: req.query.rating ? Number(req.query.rating) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const result = await mentorshipReviewService.getAllReviewsAdmin(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All mentorship reviews retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moderateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);
    const reviewId = String(req.params.id);

    const review = await mentorshipReviewService.moderateReview(
      reviewId,
      req.body as IModerateMentorshipReview,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review moderated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReviewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviewId = String(req.params.id);

    const result = await mentorshipReviewService.deleteReviewAdmin(reviewId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship review deleted by admin successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const mentorshipReviewController = {
  createReview,
  getReviewsForMentor,
  getMyReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReviewAdmin,
};
