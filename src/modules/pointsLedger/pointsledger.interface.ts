import { Types } from "mongoose";

export const POINTS_LEDGER_TYPES = [
  "credit",
  "debit",
  "adjustment",
  "reward",
  "penalty",
] as const;

export const POINTS_LEDGER_SOURCE_TYPES = [
  "module",
  "video",
  "quiz",
  "action",
  "session",
  "manual",
  "system",
  "other",
] as const;

export const POINTS_LEDGER_REASONS = [
  "module_completion",
  "video_completion",
  "quiz_pass",
  "action_complete",
  "session_attendance",
  "manual_adjustment",
  "system_reward",
  "penalty",
  "other",
] as const;

export type PointsLedgerType = (typeof POINTS_LEDGER_TYPES)[number];
export type PointsLedgerSourceType = (typeof POINTS_LEDGER_SOURCE_TYPES)[number];
export type PointsLedgerReason = (typeof POINTS_LEDGER_REASONS)[number];

export interface IPointsLedger {
  user: Types.ObjectId;
  sourceType?: PointsLedgerSourceType | undefined;
  sourceId?: Types.ObjectId | undefined;
  sourceEntity?: string | undefined;

  points: number;
  transactionType: PointsLedgerType;
  reason: PointsLedgerReason;
  description?: string | undefined;

  balanceAfter?: number | undefined;
  balanceBefore?: number | undefined;

  module?: Types.ObjectId | undefined;
  video?: Types.ObjectId | undefined;
  action?: Types.ObjectId | undefined;
  quiz?: Types.ObjectId | undefined;
  session?: Types.ObjectId | undefined;

  metadata?: Record<string, unknown> | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreatePointsLedgerInput {
  user: string;
  sourceType?: PointsLedgerSourceType | undefined;
  sourceId?: string | undefined;
  sourceEntity?: string | undefined;
  points: number;
  transactionType: PointsLedgerType;
  reason: PointsLedgerReason;
  description?: string | undefined;
  balanceAfter?: number | undefined;
  balanceBefore?: number | undefined;
  module?: string | undefined;
  video?: string | undefined;
  action?: string | undefined;
  quiz?: string | undefined;
  session?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface IPointsLedgerQuery {
  userId?: string | undefined;
  sourceType?: PointsLedgerSourceType | undefined;
  sourceEntity?: string | undefined;
  reason?: PointsLedgerReason | undefined;
  transactionType?: PointsLedgerType | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}
