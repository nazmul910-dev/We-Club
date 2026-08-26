import mongoose, { QueryFilter, Types } from "mongoose";

import { User } from "../users/users.model.schema";
import { MentorshipProfile } from "../mentorshipProfiles/mentorship.profile.model.schema";

import {
  ICreateMentorshipReview,
  IMentorReviewStats,
  IMentorshipReview,
  IMentorshipReviewQuery,
  IModerateMentorshipReview,
  IUpdateMentorshipReview,
} from "./mentorship.review.interface";

import { MentorshipReview } from "./mentorship.review.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const getReviewPopulate = () => {
  const populateList: Array<{ path: string; select?: string }> = [
    {
      path: "user",
      select: "fullName email profileImage role",
    },
    {
      path: "mentor",
      select: "fullName email profileImage role",
    },
    {
      path: "mentorshipProfile",
      select: "bio expertise isPrimaryMentor sessionDurationMinutes profileImage",
    },
    {
      path: "moderatedBy",
      select: "fullName email role",
    },
  ];

  if (mongoose.models.MentorBooking) {
    populateList.push({
      path: "booking",
      select: "status sessionDate startTime endTime timeZone meetingLink",
    });
  }

  return populateList;
};

const ensureMentorUserExists = async (mentorId: string) => {
  assertValidObjectId(mentorId, "Mentor ID");

  const mentor = await User.findById(mentorId).select(
    "_id fullName email role profileImage",
  ).lean();

  assertFound(mentor, "Mentor user not found", 404);

  return mentor;
};

const verifyBookingForReview = async (
  bookingId: string,
  userId: string,
  mentorId: string,
) => {
  assertValidObjectId(bookingId, "Booking ID");

  // Check if MentorBooking model is registered in mongoose
  if (mongoose.models.MentorBooking) {
    const booking = await mongoose
      .model("MentorBooking")
      .findById(bookingId)
      .lean() as {
        _id: Types.ObjectId;
        user?: Types.ObjectId;
        mentee?: Types.ObjectId;
        client?: Types.ObjectId;
        mentor?: Types.ObjectId;
        status?: string;
      } | null;

    assertFound(booking, "Mentorship booking not found", 404);

    const bookingUserId = (
      booking.user ||
      booking.mentee ||
      booking.client
    )?.toString();

    if (bookingUserId && bookingUserId !== userId) {
      throwServiceError(
        "You can only review mentorship sessions booked by yourself",
        403,
      );
    }

    const bookingMentorId = booking.mentor?.toString();
    if (bookingMentorId && bookingMentorId !== mentorId) {
      throwServiceError(
        "The specified mentor does not match this booking record",
        400,
      );
    }

    if (booking.status && booking.status !== "completed") {
      throwServiceError(
        `Reviews are only permitted for completed sessions. Current status: ${booking.status}`,
        400,
      );
    }
  }
};

const createReview = async (
  payload: ICreateMentorshipReview,
  userId: string,
) => {
  assertValidObjectId(payload.booking, "Booking ID");
  assertValidObjectId(payload.mentor, "Mentor ID");

  if (payload.mentor === userId) {
    throwServiceError("Mentors cannot submit reviews for themselves", 400);
  }

  await ensureMentorUserExists(payload.mentor);
  await verifyBookingForReview(payload.booking, userId, payload.mentor);

  const existingReview = await MentorshipReview.findOne({
    booking: new Types.ObjectId(payload.booking),
  }).lean();

  if (existingReview) {
    throwServiceError(
      "A review has already been submitted for this mentorship booking",
      409,
    );
  }

  let mentorshipProfileId = payload.mentorshipProfile;
  if (!mentorshipProfileId) {
    const profile = await MentorshipProfile.findOne({
      mentor: new Types.ObjectId(payload.mentor),
    }).select("_id").lean();

    if (profile) {
      mentorshipProfileId = profile._id.toString();
    }
  }

  const createData: Record<string, unknown> = {
    booking: new Types.ObjectId(payload.booking),
    user: new Types.ObjectId(userId),
    mentor: new Types.ObjectId(payload.mentor),
    rating: payload.rating,
    status: "published",
    isAnonymous: payload.isAnonymous ?? false,
    helpfulCount: 0,
  };

  if (mentorshipProfileId) {
    assertValidObjectId(mentorshipProfileId, "Mentorship profile ID");
    createData.mentorshipProfile = new Types.ObjectId(mentorshipProfileId);
  }

  if (payload.comment) {
    createData.comment = payload.comment.trim();
  }

  try {
    const review = await MentorshipReview.create(createData);
    return review.populate(getReviewPopulate());
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A review has already been submitted for this mentorship booking",
        409,
      );
    }
    throw error;
  }
};

const getReviewsForMentor = async (
  mentorId: string,
  options?: { page?: number | undefined; limit?: number | undefined } | undefined,
) => {
  assertValidObjectId(mentorId, "Mentor ID");

  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, Math.min(50, options?.limit ?? 10));
  const skip = (page - 1) * limit;

  // Filter: check if mentorId is User ID or MentorshipProfile ID
  let filter: QueryFilter<IMentorshipReview> = {
    $or: [
      { mentor: new Types.ObjectId(mentorId) },
      { mentorshipProfile: new Types.ObjectId(mentorId) },
    ],
    status: "published",
  };

  const [reviews, total, aggregateStats] = await Promise.all([
    MentorshipReview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getReviewPopulate()).lean(),
    MentorshipReview.countDocuments(filter),
    MentorshipReview.aggregate<{
      _id: number;
      count: number;
    }>([
      {
        $match: {
          $or: [
            { mentor: new Types.ObjectId(mentorId) },
            { mentorshipProfile: new Types.ObjectId(mentorId) },
          ],
          status: "published",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const ratingBreakdown = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalScore = 0;
  let totalReviewCount = 0;

  for (const item of aggregateStats) {
    const star = item._id as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) {
      ratingBreakdown[star] = item.count;
      totalScore += star * item.count;
      totalReviewCount += item.count;
    }
  }

  const averageRating =
    totalReviewCount > 0
      ? Number((totalScore / totalReviewCount).toFixed(1))
      : 0;

  const stats: IMentorReviewStats = {
    averageRating,
    totalReviews: totalReviewCount,
    ratingBreakdown,
  };

  // Mask user info if review is anonymous
  const sanitizedReviews = reviews.map((rev) => {
  if (rev.isAnonymous) {
    return { ...rev, user: { fullName: "Anonymous Member", role: "we_club_member" } };
  }
  return rev;
});

  return {
    stats,
    data: sanitizedReviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyReviews = async (
  userId: string,
  options?: { page?: number | undefined; limit?: number | undefined } | undefined,
) => {
  assertValidObjectId(userId, "User ID");

  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, Math.min(50, options?.limit ?? 10));
  const skip = (page - 1) * limit;

  const filter = { user: new Types.ObjectId(userId) };

  const [reviews, total] = await Promise.all([
    MentorshipReview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getReviewPopulate())
      .lean(),
    MentorshipReview.countDocuments(filter),
  ]);

  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleReview = async (
  reviewId: string,
  actorUserId?: string,
  actorRole?: string,
) => {
  assertValidObjectId(reviewId, "Review ID");

  const review = await MentorshipReview.findById(reviewId).populate(
    getReviewPopulate(),
  ).lean();

  assertFound(review, "Mentorship review not found", 404);

  const isOwner = actorUserId && review.user.toString() === actorUserId;
  const isAdmin =
    actorRole === "founder" ||
    actorRole === "manager" ||
    actorRole === "admin" ||
    actorRole === "super_admin";

  if (review.status !== "published" && !isOwner && !isAdmin) {
    throwServiceError("Mentorship review not found", 404);
  }

  const doc = review
  if (doc.isAnonymous && !isOwner && !isAdmin) {
    doc.user = {
      fullName: "Anonymous Member",
      role: "we_club_member",
    } as unknown as Types.ObjectId;
  }

  return doc;
};

const updateReview = async (
  reviewId: string,
  payload: IUpdateMentorshipReview,
  userId: string,
) => {
  assertValidObjectId(reviewId, "Review ID");

  const review = await MentorshipReview.findById(reviewId);

  assertFound(review, "Mentorship review not found", 404);

  if (review.user.toString() !== userId) {
    throwServiceError(
      "You are not authorized to update another user's review",
      403,
    );
  }

  if (payload.rating !== undefined) {
    review.rating = payload.rating;
  }

  if (payload.comment === null) {
    review.set("comment", undefined);
  } else if (payload.comment !== undefined) {
    review.comment = payload.comment.trim();
  }

  if (payload.isAnonymous !== undefined) {
    review.isAnonymous = payload.isAnonymous;
  }

  await review.save();

  return review.populate(getReviewPopulate());
};

const deleteReview = async (reviewId: string, userId: string) => {
  assertValidObjectId(reviewId, "Review ID");

  const review = await MentorshipReview.findById(reviewId);

  assertFound(review, "Mentorship review not found", 404);

  if (review.user.toString() !== userId) {
    throwServiceError(
      "You are not authorized to delete another user's review",
      403,
    );
  }

  await MentorshipReview.findByIdAndDelete(reviewId);

  return { id: reviewId, deleted: true };
};

const getAllReviewsAdmin = async (query: IMentorshipReviewQuery) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IMentorshipReview> = {};

  if (query.mentor) {
    assertValidObjectId(query.mentor, "Mentor ID");
    filter.mentor = new Types.ObjectId(query.mentor);
  }

  if (query.user) {
    assertValidObjectId(query.user, "User ID");
    filter.user = new Types.ObjectId(query.user);
  }

  if (query.booking) {
    assertValidObjectId(query.booking, "Booking ID");
    filter.booking = new Types.ObjectId(query.booking);
  }

  if (query.mentorshipProfile) {
    assertValidObjectId(query.mentorshipProfile, "Mentorship Profile ID");
    filter.mentorshipProfile = new Types.ObjectId(query.mentorshipProfile);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.rating) {
    filter.rating = query.rating;
  }

  const sortField = query.sortBy || "createdAt";
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [reviews, total] = await Promise.all([
    MentorshipReview.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate(getReviewPopulate())
      .lean(),
    MentorshipReview.countDocuments(filter),
  ]);

  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const moderateReview = async (
  reviewId: string,
  payload: IModerateMentorshipReview,
  adminId: string,
) => {
  assertValidObjectId(reviewId, "Review ID");

  const review = await MentorshipReview.findById(reviewId);

  assertFound(review, "Mentorship review not found", 404);

  review.status = payload.status;
  review.moderatedBy = new Types.ObjectId(adminId);
  review.moderatedAt = new Date();

  if (payload.adminNotes !== undefined) {
    review.adminNotes = payload.adminNotes;
  }

  await review.save();

  return review.populate(getReviewPopulate());
};

const deleteReviewAdmin = async (reviewId: string) => {
  assertValidObjectId(reviewId, "Review ID");

  const review = await MentorshipReview.findByIdAndDelete(reviewId);

  assertFound(review, "Mentorship review not found", 404);

  return { id: reviewId, deleted: true };
};

export const mentorshipReviewService = {
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
