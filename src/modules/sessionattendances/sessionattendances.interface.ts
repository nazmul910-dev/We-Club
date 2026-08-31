import { Types } from "mongoose";

export const SESSION_ATTENDANCE_STATUSES = [
  "registered",
  "attended",
  "late",
  "no_show",
  "cancelled",
] as const;

export type SessionAttendanceStatus =
  (typeof SESSION_ATTENDANCE_STATUSES)[number];

export interface ISessionAttendance {
  session: Types.ObjectId;

  user: Types.ObjectId;

  status: SessionAttendanceStatus;

  registeredAt?: Date | undefined;

  joinedAt?: Date | undefined;
  leftAt?: Date | undefined;

  markedBy?: Types.ObjectId | undefined;

  cancellationReason?: string | undefined;
  cancelledAt?: Date | undefined;

  notes?: string | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IRegisterSessionAttendance {
  session: string;
  user: string;
}


export interface IMarkSessionAttendance {
  session: string;
  user: string;

  status: SessionAttendanceStatus;

  markedBy?: string | undefined;

  notes?: string | undefined;
}

export interface ICancelSessionAttendance {
  session: string;
  user: string;

  reason?: string | undefined;
}

export interface ISessionAttendanceQuery {
  sessionId?: string | undefined;
  userId?: string | undefined;

  status?: SessionAttendanceStatus | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}