import { model, Schema } from "mongoose";

import {
  IMentorBooking,
  MENTOR_BOOKING_STATUSES,
  NO_SHOW_PARTIES,
} from "./mentor.booking.interface";

const mentorBookingSchema = new Schema<IMentorBooking>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    leadMentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    leadMentorProfile: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true,
    },

    coMentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    coMentorProfile: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipProfile",
      index: true,
    },

    scheduledStartTime: {
      type: Date,
      required: true,
      index: true,
    },

    scheduledEndTime: {
      type: Date,
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 180,
      required: true,
    },

    timezone: {
      type: String,
      required: true,
      trim: true,
    },

    meetingUrl: {
      type: String,
      trim: true,
    },

    sessionTopic: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: MENTOR_BOOKING_STATUSES,
      default: "requested",
      index: true,
      required: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    noShowAt: {
      type: Date,
    },

    noShowBy: {
      type: String,
      enum: NO_SHOW_PARTIES,
    },

    noShowReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    mentorFeedback: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "mentorbookings",
  },
);

mentorBookingSchema.index({
  member: 1,
  status: 1,
});

mentorBookingSchema.index({
  leadMentor: 1,
  status: 1,
});

mentorBookingSchema.index({
  coMentor: 1,
  status: 1,
});

mentorBookingSchema.index({
  scheduledStartTime: 1,
  scheduledEndTime: 1,
});

mentorBookingSchema.index({
  status: 1,
  scheduledStartTime: 1,
});

export const MentorBooking = model<IMentorBooking>(
  "MentorBooking",
  mentorBookingSchema,
);
