import { model, Schema } from "mongoose";

import { ILeaderboardEntry } from "./leaderboard.entry.interface";

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    leaderboard: {
      type: Schema.Types.ObjectId,
      ref: "Leaderboard",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    rank: {
      type: Number,
      default: null,
    },

    breakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "leaderboardentries",
    optimisticConcurrency: true,
  },
);


leaderboardEntrySchema.index(
  {
    leaderboard: 1,
    user: 1,
  },
  {
    unique: true,
  },
);


leaderboardEntrySchema.index({
  leaderboard: 1,
  points: -1,
});

leaderboardEntrySchema.index({
  leaderboard: 1,
  rank: 1,
});

export const LeaderboardEntry = model<ILeaderboardEntry>(
  "LeaderboardEntry",
  leaderboardEntrySchema,
);
