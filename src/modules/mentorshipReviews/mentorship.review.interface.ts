import { Types } from "mongoose";

export const MENTORSHIP_REVIEW_STATUSES = [
  "published",
  "hidden",
  "flagged",
] as const;

export type MentorshipReviewStatus =
  (typeof MENTORSHIP_REVIEW_STATUSES)[number];

export interface IMentorshipReview {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  mentor: Types.ObjectId;
  mentorshipProfile?: Types.ObjectId | undefined;

  rating: number;
  comment?: string | undefined;

  status: MentorshipReviewStatus;
  isAnonymous: boolean;
  helpfulCount: number;

  adminNotes?: string | undefined;
  moderatedBy?: Types.ObjectId | undefined;
  moderatedAt?: Date | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateMentorshipReview {
  booking: string;
  mentor: string;
  mentorshipProfile?: string | undefined;
  rating: number;
  comment?: string | undefined;
  isAnonymous?: boolean | undefined;
}

export interface IUpdateMentorshipReview {
  rating?: number | undefined;
  comment?: string | undefined;
  isAnonymous?: boolean | undefined;
}

export interface IModerateMentorshipReview {
  status: MentorshipReviewStatus;
  adminNotes?: string | undefined;
}

export interface IMentorshipReviewQuery {
  mentor?: string | undefined;
  mentorshipProfile?: string | undefined;
  user?: string | undefined;
  booking?: string | undefined;
  status?: MentorshipReviewStatus | undefined;
  rating?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: "createdAt" | "rating" | "helpfulCount" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface IMentorReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
