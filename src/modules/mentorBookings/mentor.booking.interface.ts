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

export interface IMentorBookingRecording {
  provider: "cloudinary";
  cloudinaryPublicId: string;
  cloudinaryAssetId?: string | undefined;
  secureUrl: string;
  playbackUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  durationSeconds?: number | undefined;
  format?: string | undefined;
  bytes?: number | undefined;
}

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

  recordingTitle?: string | undefined;
  recording?: IMentorBookingRecording | undefined;

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
  sessionTopic: string;
  meetingUrl: string;
  notes?: string | undefined;
}

export interface ICancelMentorBooking {
  reason: string;
}

export interface ICompleteMentorBooking {
  recordingTitle: string;
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

// ---- Types for GET /invictus/mentor-bookings/me/my-mentor ----
// Kept here (rather than relying on inference) so the frontend can mirror
// this shape exactly. NOTE: these describe the shape after Mongoose
// .populate(...).lean() resolves the refs, so fields typed as
// Types.ObjectId above (member, leadMentor, coMentor, etc.) appear here
// as the summary objects below instead.

export interface IUserSummary {
  _id: Types.ObjectId | string;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string | undefined;
}

export interface IMentorshipProfileSummary {
  _id: Types.ObjectId | string;
  mentor?: IUserSummary;
  bio?: string;
  expertise?: string[];
  profileImage?: string;
  sessionDurationMinutes?: number;
  isPrimaryMentor?: boolean;
  isActive?: boolean;
  status?: string;
}

export interface IMentorPairing {
  mentor: IUserSummary;
  mentorProfile: IMentorshipProfileSummary;
}

/**
 * - primaryMentor: the platform's single configured primary mentor.
 *   Same for every member, always present.
 * - coMentor: the non-primary mentor this member selected for themselves
 *   (User.assignedCoMentorProfile). Null until they've picked one via
 *   PATCH /invictus/mentorship-profiles/me/co-mentor.
 * - nextSession: the member's soonest upcoming confirmed booking, or most
 *   recent active booking as a fallback. Informational only — does not
 *   determine who the mentor/co-mentor are.
 */
export interface IMyMentorResponse {
  primaryMentor: IMentorPairing;
  coMentor: IMentorPairing | null;
  nextSession: IMentorBooking | null;
}