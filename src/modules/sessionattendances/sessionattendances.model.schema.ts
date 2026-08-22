import { model, Schema } from "mongoose";

import {
  ISessionAttendance,
  SESSION_ATTENDANCE_STATUSES,
} from "./sessionattendances.interface";

const sessionAttendanceSchema = new Schema<ISessionAttendance>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: "SessionSchedule",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: SESSION_ATTENDANCE_STATUSES,
      default: "registered",
      index: true,
    },

    registeredAt: {
      type: Date,
      default: () => new Date(),
    },

    joinedAt: {
      type: Date,
    },

    leftAt: {
      type: Date,
    },

    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    cancelledAt: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: "sessionattendance",
  },
);


sessionAttendanceSchema.index(
  {
    session: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

sessionAttendanceSchema.index({
  session: 1,
  status: 1,
});

sessionAttendanceSchema.index({
  user: 1,
  status: 1,
});

export const SessionAttendance = model<ISessionAttendance>(
  "SessionAttendance",
  sessionAttendanceSchema,
);