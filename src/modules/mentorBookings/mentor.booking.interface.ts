import { Types } from "mongoose";

export const MENTOR_BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type MentorBookingStatus = (typeof MENTOR_BOOKING_STATUSES)[number];

export const NO_SHOW_PARTIES = ["member", "mentor", "both"] as const;

export type NoShowParty = (typeof NO_SHOW_PARTIES)[number];

export interface IMentorBooking {
  member: Types.ObjectId;

  leadMentor: Types.ObjectId;
  leadMentorProfile?: Types.ObjectId | undefined;

  coMentor?: Types.ObjectId | undefined;
  coMentorProfile?: Types.ObjectId | undefined;

  scheduledStartTime: Date;
  scheduledEndTime: Date;
  durationMinutes: number;
  timezone: string;

  meetingUrl?: string | undefined;
  sessionTopic?: string | undefined;
  notes?: string | undefined;

  status: MentorBookingStatus;

  cancellationReason?: string | undefined;
  cancelledBy?: Types.ObjectId | undefined;
  cancelledAt?: Date | undefined;

  completedAt?: Date | undefined;

  noShowAt?: Date | undefined;
  noShowBy?: NoShowParty | undefined;
  noShowReason?: string | undefined;

  mentorFeedback?: string | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateMentorBooking {
  leadMentor: string;
  leadMentorProfile?: string | undefined;

  coMentor?: string | undefined;
  coMentorProfile?: string | undefined;

  scheduledStartTime: string;
  durationMinutes?: number | undefined;
  timezone: string;

  sessionTopic?: string | undefined;
  notes?: string | undefined;
  meetingUrl?: string | undefined;
}

export interface IUpdateMentorBooking {
  leadMentor?: string | undefined;
  leadMentorProfile?: string | undefined;

  coMentor?: string | null | undefined;
  coMentorProfile?: string | null | undefined;

  scheduledStartTime?: string | undefined;
  durationMinutes?: number | undefined;
  timezone?: string | undefined;

  sessionTopic?: string | undefined;
  notes?: string | undefined;
  meetingUrl?: string | null | undefined;
}

export interface IConfirmMentorBooking {
  meetingUrl?: string | undefined;
}

export interface ICancelMentorBooking {
  reason: string;
}

export interface ICompleteMentorBooking {
  mentorFeedback?: string | undefined;
}

export interface INoShowMentorBooking {
  noShowBy: NoShowParty;
  reason?: string | undefined;
}

export interface IMentorBookingQuery {
  memberId?: string | undefined;
  leadMentorId?: string | undefined;
  coMentorId?: string | undefined;
  mentorId?: string | undefined;
  status?: MentorBookingStatus | undefined;

  startDate?: string | undefined;
  endDate?: string | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
