import { model, Schema } from "mongoose";

import {
  IStreakLog,
  STREAK_ACTIVITY_TYPES,
  STREAK_TIMEZONES,
} from "./streaklog.interface";

const streakLogSchema = new Schema<IStreakLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    academyProfile: {
      type: Schema.Types.ObjectId,
      ref: "AcademyProfile",
      index: true,
    },

    activityDate: {
      type: Date,
      required: true,
      index: true,
    },

    normalizedDate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },

    timezone: {
      type: String,
      enum: STREAK_TIMEZONES,
      default: "UTC",
      required: true,
      index: true,
    },

    activityType: {
      type: String,
      enum: STREAK_ACTIVITY_TYPES,
      default: "manual",
      required: true,
      index: true,
    },

    activityCount: {
      type: Number,
      default: 1,
      min: 1,
      required: true,
    },

    currentStreakDays: {
      type: Number,
      default: 1,
      min: 0,
      required: true,
    },

    longestStreakDays: {
      type: Number,
      default: 1,
      min: 0,
      required: true,
    },

    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "streaklog",
  },
);

streakLogSchema.index({ user: 1, activityDate: 1 }, { unique: true });
streakLogSchema.index({ user: 1, normalizedDate: 1 });
streakLogSchema.index({ academyProfile: 1, normalizedDate: 1 });

export const StreakLog = model<IStreakLog>("StreakLog", streakLogSchema);
