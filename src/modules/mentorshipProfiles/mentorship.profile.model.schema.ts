import { model, Schema } from "mongoose";

import {
  AVAILABILITY_DAYS,
  IMentorshipAvailabilitySlot,
  IMentorshipProfile,
  MENTORSHIP_PROFILE_STATUSES,
} from "./mentorship.profile.interface";

const availabilitySlotSchema = new Schema<IMentorshipAvailabilitySlot>(
  {
    day: {
      type: String,
      enum: AVAILABILITY_DAYS,
      required: true,
      lowercase: true,
      trim: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    timezone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const mentorshipProfileSchema = new Schema<IMentorshipProfile>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    bio: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    expertise: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },

    profileImage: {
      type: String,
      trim: true,
    },

    isPrimaryMentor: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 80,
    },

    sessionDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 180,
    },

    status: {
      type: String,
      enum: MENTORSHIP_PROFILE_STATUSES,
      default: "draft",
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    publishedAt: {
      type: Date,
    },

    archivedAt: {
      type: Date,
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
    collection: "mentorshipprofiles",
  },
);

mentorshipProfileSchema.index({
  isActive: 1,
  status: 1,
  order: 1,
});

mentorshipProfileSchema.index({
  isPrimaryMentor: 1,
  isActive: 1,
});

mentorshipProfileSchema.index(
  { isPrimaryMentor: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimaryMentor: true },
    name: "one_primary_mentor",
  },
);

export const MentorshipProfile = model<IMentorshipProfile>(
  "MentorshipProfile",
  mentorshipProfileSchema,
);
