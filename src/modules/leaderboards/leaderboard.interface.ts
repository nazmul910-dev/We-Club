import { Types } from "mongoose";

export const LEADERBOARD_TYPES = [
  "points",
  "streak",
  "course_completion",
  "quiz_score",
  "custom",
] as const;

export type LeaderboardType = (typeof LEADERBOARD_TYPES)[number];

export const LEADERBOARD_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "all_time",
] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const LEADERBOARD_STATUSES = [
  "draft",
  "active",
  "finalized",
  "archived",
] as const;

export type LeaderboardStatus = (typeof LEADERBOARD_STATUSES)[number];

export interface ILeaderboard {
  title: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;

  startAt: Date;
  endAt: Date;

  status: LeaderboardStatus;

  description?: string | undefined;

  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateLeaderboardPayload {
  title: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;

  startAt: Date;
  endAt: Date;

  description?: string | undefined;
}

export interface IUpdateLeaderboardPayload {
  title?: string | undefined;
  description?: string | undefined;

  startAt?: Date | undefined;
  endAt?: Date | undefined;
}

export interface IGetAllLeaderboardsQuery {
  type?: LeaderboardType | undefined;
  period?: LeaderboardPeriod | undefined;
  status?: LeaderboardStatus | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
