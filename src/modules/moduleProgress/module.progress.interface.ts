import { Types } from "mongoose";

export const QUIZ_PROGRESS_STATUSES = [
  "locked",
  "unlocked",
  "in_progress",
  "passed",
  "failed",
] as const;

export type QuizProgressStatus = (typeof QUIZ_PROGRESS_STATUSES)[number];

export interface IModuleRequirementSummary {
  totalRequired: number;
  completedRequired: number;
  completionPercent: number;
  completed: boolean;
}

export interface IModuleQuizSummary {
  status: QuizProgressStatus;

  attemptsUsed: number;
  maximumAttempts: number;

  bestScore: number;
  passScore: number;

  passed: boolean;

  lastAttemptAt?: Date | undefined;
}

export interface IModuleProgress {
  user: Types.ObjectId;
  module: Types.ObjectId;

  videoSummary: IModuleRequirementSummary;
  resourceSummary: IModuleRequirementSummary;
  actionSummary: IModuleRequirementSummary;
  quizSummary: IModuleQuizSummary;

  actionsUnlocked: boolean;
  quizUnlocked: boolean;

  overallCompletionPercent: number;

  isCompleted: boolean;
  completedAt?: Date | undefined;

  lastCalculatedAt: Date;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ISyncRequirementSummary {
  userId: string;
  moduleId: string;

  totalRequired: number;
  completedRequired: number;
}

export interface ISyncQuizSummary {
  userId: string;
  moduleId: string;

  attemptsUsed: number;
  bestScore: number;
  passed: boolean;

  lastAttemptAt?: Date | undefined;
}

export interface IModuleProgressAdminQuery {
  userId?: string | undefined;
  moduleId?: string | undefined;
  isCompleted?: boolean | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}

export interface IUserModuleProgressGroup {
  user: Types.ObjectId | Record<string, unknown> | null;

  totalModules: number;
  completedModules: number;
  avgCompletionPercent: number;
  isFullyCompleted: boolean;

  lastUpdatedAt: Date | undefined;

  records: IModuleProgress[];
}