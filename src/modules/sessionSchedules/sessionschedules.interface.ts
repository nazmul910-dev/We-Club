import { Types } from "mongoose";

export const SESSION_TYPES = [
  "academy_live",
  "mentorship_group",
  "retreat_prep",
  "community_call",
  "other",
] as const;

export const SESSION_STATUSES = [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
  "postponed",
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface ISessionSchedule {
  title: string;

  description?: string | undefined;

  sessionType: SessionType;

  host: Types.ObjectId;

  pillar?: Types.ObjectId | undefined;
  courseModule?: Types.ObjectId | undefined;

  startTime: Date;
  endTime: Date;
  timezone: string;

  meetingUrl?: string | undefined;

  capacity?: number | undefined;

  status: SessionStatus;

  cancellationReason?: string | undefined;
  cancelledBy?: Types.ObjectId | undefined;
  cancelledAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateSessionSchedule {
  title: string;

  description?: string | undefined;

  sessionType: SessionType;

  host: string;

  pillar?: string | undefined;
  courseModule?: string | undefined;

  startTime: string;
  endTime: string;
  timezone: string;

  meetingUrl?: string | undefined;

  capacity?: number | undefined;
}

export interface IUpdateSessionSchedule {
  title?: string | undefined;

  description?: string | undefined;

  sessionType?: SessionType | undefined;

  host?: string | undefined;

  pillar?: string | null | undefined;
  courseModule?: string | null | undefined;

  startTime?: string | undefined;
  endTime?: string | undefined;
  timezone?: string | undefined;

  meetingUrl?: string | null | undefined;

  capacity?: number | null | undefined;

  status?: SessionStatus | undefined;
}

export interface ICancelSessionSchedule {
  reason: string;
}

export interface ISessionScheduleQuery {
  hostId?: string | undefined;
  pillarId?: string | undefined;
  courseModuleId?: string | undefined;

  sessionType?: SessionType | undefined;
  status?: SessionStatus | undefined;

  startDate?: string | undefined;
  endDate?: string | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}