import { model, Schema } from "mongoose";

import {
  ISessionSchedule,
  SESSION_STATUSES,
  SESSION_TYPES,
} from "./sessionschedules.interface";

const sessionScheduleSchema = new Schema<ISessionSchedule>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    sessionType: {
      type: String,
      enum: SESSION_TYPES,
      required: true,
      index: true,
    },

    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pillar: {
      type: Schema.Types.ObjectId,
      ref: "ChallengePillar",
      index: true,
    },

    courseModule: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
      index: true,
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

    capacity: {
      type: Number,
      min: 1,
    },

    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: "scheduled",
      index: true,
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
    collection: "sessionschedule",
  },
);

/**
 * "Validate end time after start time" — model-level guard,
 * সব entry point (create/update) থেকেই এটা কার্যকর হবে।
 */
sessionScheduleSchema.pre("validate", function () {
  if (
    this.startTime &&
    this.endTime &&
    this.endTime.getTime() <= this.startTime.getTime()
  ) {
    this.invalidate("endTime", "End time must be after start time");
  }
});

sessionScheduleSchema.index({
  host: 1,
  startTime: 1,
});

sessionScheduleSchema.index({
  pillar: 1,
  startTime: 1,
});

sessionScheduleSchema.index({
  status: 1,
  startTime: 1,
});

export const SessionSchedule = model<ISessionSchedule>(
  "SessionSchedule",
  sessionScheduleSchema,
);