import { model, Schema } from "mongoose";

import {
  ILeaderboard,
  LEADERBOARD_PERIODS,
  LEADERBOARD_STATUSES,
  LEADERBOARD_TYPES,
} from "./leaderboard.interface";

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: LEADERBOARD_TYPES,
      required: true,
      index: true,
    },

    period: {
      type: String,
      enum: LEADERBOARD_PERIODS,
      required: true,
      index: true,
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: LEADERBOARD_STATUSES,
      default: "draft",
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "leaderboards",
    optimisticConcurrency: true,
  },
);


leaderboardSchema.index(
  {
    type: 1,
    period: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active",
    },
  },
);

leaderboardSchema.index({
  status: 1,
  createdAt: -1,
});

export const Leaderboard = model<ILeaderboard>("Leaderboard", leaderboardSchema);
