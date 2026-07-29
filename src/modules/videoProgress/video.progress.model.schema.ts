import { model, Schema } from "mongoose";

import { IVideoProgress, IWatchedRange } from "./video.progress.interface";

const watchedRangeSchema = new Schema<IWatchedRange>(
  {
    startSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    endSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const videoProgressSchema = new Schema<IVideoProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "ModuleVideo",
      required: true,
      index: true,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    durationSecondsSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    requiredWatchPercentSnapshot: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    watchedRanges: {
      type: [watchedRangeSchema],
      default: [],
    },

    totalWatchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    watchPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lastPositionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    lastWatchedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,

    collection: "videoprogress",

    /**
     * Prevent silent concurrent overwrites.
     */
    optimisticConcurrency: true,
  },
);

/**
 * One user can have only one progress
 * document for one video.
 */
videoProgressSchema.index(
  {
    user: 1,
    video: 1,
  },
  {
    unique: true,
  },
);

/**
 * Used for module video progress summary.
 */
videoProgressSchema.index({
  user: 1,
  module: 1,
  isCompleted: 1,
});

/**
 * Used for admin progress reports.
 */
videoProgressSchema.index({
  module: 1,
  isCompleted: 1,
  updatedAt: -1,
});

videoProgressSchema.index({
  user: 1,
  lastWatchedAt: -1,
});

export const VideoProgress = model<IVideoProgress>(
  "VideoProgress",
  videoProgressSchema,
);
