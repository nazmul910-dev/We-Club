import { Types } from "mongoose";

export const ONBOARDING_TASK_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type OnboardingTaskStatus = (typeof ONBOARDING_TASK_STATUSES)[number];

/**
 * manual         -> user must click the action button ("Open" / "Book now")
 *                   to be marked complete (frontend calls the /complete route
 *                   once the linked flow is finished).
 * auto_on_login  -> automatically marked complete the next time the user
 *                   logs in (e.g. "Welcome Video", "Join the Community Rooms").
 * video_watch    -> automatically marked complete when the linked
 *                   ModuleVideo (`linkedVideo`) is completed by the user.
 */
export const ONBOARDING_TASK_TRIGGERS = [
  "manual",
  "auto_on_login",
  "video_watch",
] as const;

export type OnboardingTaskTrigger = (typeof ONBOARDING_TASK_TRIGGERS)[number];

export interface IOnboardingTask {
  title: string;
  description?: string | undefined;

  order: number;

  trigger: OnboardingTaskTrigger;

  actionLabel?: string | undefined;
  actionUrl?: string | undefined;

  linkedVideo?: Types.ObjectId | undefined;

  pointsReward: number;

  status: OnboardingTaskStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateOnboardingTask {
  title: string;
  description?: string | undefined;
  order: number;
  trigger?: OnboardingTaskTrigger | undefined;
  actionLabel?: string | undefined;
  actionUrl?: string | undefined;
  linkedVideo?: string | undefined;
  pointsReward?: number | undefined;
}

export interface IUpdateOnboardingTask {
  title?: string | undefined;
  description?: string | null | undefined;
  order?: number | undefined;
  trigger?: OnboardingTaskTrigger | undefined;
  actionLabel?: string | null | undefined;
  actionUrl?: string | null | undefined;
  linkedVideo?: string | null | undefined;
  pointsReward?: number | undefined;
}

export interface IOnboardingTaskCompletion {
  user: Types.ObjectId;
  task: Types.ObjectId;
  pointsAwarded: number;
  completedAt: Date;
}

/**
 * Shape returned by GET /onboarding-tasks/me — one row per
 * published task, decorated with this user's completion state.
 * Matches the "Your First Week" checklist UI 1:1.
 */
export interface IMyOnboardingChecklistItem {
  _id: Types.ObjectId;
  title: string;
  description?: string | undefined;
  order: number;
  trigger: OnboardingTaskTrigger;
  actionLabel?: string | undefined;
  actionUrl?: string | undefined;
  pointsReward: number;
  isCompleted: boolean;
  completedAt?: Date | undefined;
}