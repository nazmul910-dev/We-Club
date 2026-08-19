import { model, Schema } from "mongoose";

import {
  IMentorshipReview,
  MENTORSHIP_REVIEW_STATUSES,
} from "./mentorship.review.interface";

const mentorshipReviewSchema = new Schema<IMentorshipReview>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "MentorBooking",
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mentorshipProfile: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: MENTORSHIP_REVIEW_STATUSES,
      default: "published",
      index: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    moderatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "mentorshipreviews",
  },
);

mentorshipReviewSchema.index({
  mentor: 1,
  status: 1,
  createdAt: -1,
});

mentorshipReviewSchema.index({
  user: 1,
  createdAt: -1,
});

mentorshipReviewSchema.index({
  mentorshipProfile: 1,
  status: 1,
});

mentorshipReviewSchema.index({
  rating: 1,
  status: 1,
});

export const MentorshipReview = model<IMentorshipReview>(
  "MentorshipReview",
  mentorshipReviewSchema,
);
