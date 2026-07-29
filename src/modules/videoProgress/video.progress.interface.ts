import { Types } from "mongoose";

export interface IWatchedRange {
  startSeconds: number;
  endSeconds: number;
}

export interface IVideoProgress {
  user: Types.ObjectId;

  video: Types.ObjectId;

  /**
   * Denormalized relation for faster
   * module progress queries.
   *
   * This value is always derived from ModuleVideo.
   */
  module: Types.ObjectId;

  durationSecondsSnapshot: number;

  requiredWatchPercentSnapshot: number;

  /**
   * Unique watched video ranges.
   *
   * Example:
   * [
   *   { startSeconds: 0, endSeconds: 30 },
   *   { startSeconds: 45, endSeconds: 60 }
   * ]
   */
  watchedRanges: IWatchedRange[];

  totalWatchedSeconds: number;

  watchPercent: number;

  lastPositionSeconds: number;

  isCompleted: boolean;

  startedAt: Date;

  lastWatchedAt: Date;

  completedAt?: Date | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IRecordVideoHeartbeat {
  /**
   * Actual continuously watched segment.
   */
  segmentStartSeconds: number;

  segmentEndSeconds: number;

  /**
   * Current player position used for
   * resume playback functionality.
   */
  currentPositionSeconds: number;
}

export interface IVideoProgressAdminQuery {
  userId?: string | undefined;
  videoId?: string | undefined;
  moduleId?: string | undefined;

  isCompleted?: boolean | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
