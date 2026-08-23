import { Types } from "mongoose";

export const STREAK_TIMEZONES = ["UTC", "Asia/Dhaka"] as const;

export type StreakTimezone = (typeof STREAK_TIMEZONES)[number];

export const STREAK_ACTIVITY_TYPES = [
  "login",
  "module",
  "quiz",
  "session",
  "manual",
  "other",
] as const;

export type StreakActivityType = (typeof STREAK_ACTIVITY_TYPES)[number];

export interface IStreakLog {
  user: Types.ObjectId;
  academyProfile?: Types.ObjectId | undefined;

  activityDate: Date;
  normalizedDate: string;
  timezone: StreakTimezone;

  activityType: StreakActivityType;
  activityCount: number;

  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate?: Date | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateStreakLogInput {
  user: string;
  academyProfile?: string | undefined;
  activityDate: string | Date;
  timezone?: StreakTimezone | undefined;
  activityType?: StreakActivityType | undefined;
  activityCount?: number | undefined;
}

export interface IStreakLogQuery {
  userId?: string | undefined;
  academyProfileId?: string | undefined;
  timezone?: StreakTimezone | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}
