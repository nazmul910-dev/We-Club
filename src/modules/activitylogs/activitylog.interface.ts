import { Types } from "mongoose";

export const ACTIVITY_LOG_ACTIONS = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "status_change",
  "other",
] as const;


export const ACTIVITY_LOG_ENTITY_TYPES = [
  "User",
  "ChallengePillar",
  "CourseModule",
  "ModuleVideo",
  "ModuleResource",
  "ModuleAction",
  "QuizQuestion",
  "AcademyProfile",
  "UserEntitlement",
  "ModuleProgress",
  "QuizAttempt",
  "QuizCertificate",
  "MentorshipProfile",
  "MentorBooking",
  "MentorshipReview",
  "RetreatLocation",
  "RetreatBatch",
  "RetreatBooking",
  "CommunityPost",
  "CommunityComment",
  "CommunityLike",
  "Leaderboard",
  "LeaderboardEntry",
  "Notification",
  "NotificationTemplate",
  "PaymentPlan",
  "PaymentSession",
  "EntitlementLog",
  "SessionSchedule",
  "SessionAttendance",
  "SupportTicket",
  "FAQ",
  "TermsAndPolicy",
  "EmailTemplate",
  "SessionSchedule",
  "SessionAttendance",
  "AdminSettings",
  "Other",
] as const;

export type ActivityLogAction = (typeof ACTIVITY_LOG_ACTIONS)[number];

export type ActivityLogEntityType = (typeof ACTIVITY_LOG_ENTITY_TYPES)[number];

export interface IActivityLog {
  actor: Types.ObjectId;

  action: ActivityLogAction;

  targetEntityType: ActivityLogEntityType;

  targetEntityId?: Types.ObjectId | undefined;
  changeSummary?: string | undefined;

  changes?: Record<string, unknown> | undefined;

  ipAddress?: string | undefined;
  userAgent?: string | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateActivityLogInput {
  actor: string;

  action: ActivityLogAction;

  targetEntityType: ActivityLogEntityType;

  targetEntityId?: string | undefined;

  changeSummary?: string | undefined;

  changes?: Record<string, unknown> | undefined;

  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface IGetActivityLogsOptions {
  actorId?: string | undefined;

  action?: ActivityLogAction | undefined;

  targetEntityType?: ActivityLogEntityType | undefined;

  targetEntityId?: string | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}