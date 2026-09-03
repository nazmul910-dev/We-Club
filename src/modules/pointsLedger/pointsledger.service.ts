import { QueryFilter, Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import { User } from "../users/users.model.schema";

import {
  ICreatePointsLedgerInput,
  IPointsLedger,
  IPointsLedgerQuery,
  PointsLedgerReason,
  PointsLedgerSourceType,
} from "./pointsledger.interface";
import { PointsLedger } from "./pointsledger.model.schema";

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

/**
 * Maps a points-ledger reason to the breakdown key shown on the
 * live INVICTUS leaderboard table (see LeaderboardEntry.breakdown).
 *
 * "streak" (written by streaklog.service.ts), "modules" (a plain
 * completed-module COUNT, written by
 * moduleProgressService.syncModulesBreakdownForUser) and "success"
 * (a quiz pass-RATE %, written by
 * moduleProgressService.syncQuizSuccessBreakdownForUser) are all
 * intentionally excluded here — they are domain-specific
 * counts/percentages, not point totals, so they must never be
 * $inc'd by a raw points delta. Points transactions only ever
 * touch the top-level `points` field.
 */
const reasonToBreakdownKey = (_reason: PointsLedgerReason): string | undefined => {
  return undefined;
};

/**
 * Total points a user currently has (sum of the ledger).
 * Used for profile / associates-page summaries.
 */
const getUserTotalPoints = async (userId: string): Promise<number> => {
  const [result] = await PointsLedger.aggregate<{ total: number }>([
    { $match: { user: new Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);

  return result?.total ?? 0;
};

/**
 * Idempotent points-award helper.
 *
 * Every gamification touch-point (video watched, quiz passed,
 * module completed, onboarding task done, ...) should call this
 * instead of writing to PointsLedger / LeaderboardEntry directly.
 *
 * - Safe to call more than once for the same (user, sourceType,
 *   sourceId, reason) — the unique index on PointsLedger absorbs
 *   duplicates and this function simply returns null the second time.
 * - Automatically mirrors the points onto every currently ACTIVE
 *   "points" type leaderboard so the /invictus/leaderboard page
 *   reflects the change immediately.
 */
const awardPoints = async (payload: {
  user: string;
  points: number;
  reason: PointsLedgerReason;
  sourceType?: PointsLedgerSourceType | undefined;
  sourceId?: string | undefined;
  sourceEntity?: string | undefined;
  module?: string | undefined;
  video?: string | undefined;
  action?: string | undefined;
  quiz?: string | undefined;
  session?: string | undefined;
  description?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}) => {
  if (!payload.points || payload.points <= 0) {
    return null;
  }

  // console.log("user", payload.user)

  const user = await User.findById(payload.user).select("role").lean();
  assertFound(user, "User not found", 404);

  console.log("user role", user.role)

  if (user.role === "founder" || user.role === "manager") {
    return null;
  }



  const balanceBefore = await getUserTotalPoints(payload.user);
  const balanceAfter = balanceBefore + payload.points;

  let entry;



  try {
    entry = await PointsLedger.create({
      user: new Types.ObjectId(payload.user),
      sourceType: payload.sourceType,
      sourceId: payload.sourceId ? new Types.ObjectId(payload.sourceId) : undefined,
      sourceEntity: payload.sourceEntity,
      points: payload.points,
      transactionType: "credit",
      reason: payload.reason,
      description: payload.description,
      balanceBefore,
      balanceAfter,
      module: payload.module ? new Types.ObjectId(payload.module) : undefined,
      video: payload.video ? new Types.ObjectId(payload.video) : undefined,
      action: payload.action ? new Types.ObjectId(payload.action) : undefined,
      quiz: payload.quiz ? new Types.ObjectId(payload.quiz) : undefined,
      session: payload.session ? new Types.ObjectId(payload.session) : undefined,
      metadata: payload.metadata ?? {},
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      // Points for this exact source + reason were already awarded once.
      return null;
    }

    throw error;
  }

  try {
    const { Leaderboard } = await import("../leaderboards/leaderboard.model.schema");
    const { leaderboardEntryService } = await import(
      "../leaderboardEntries/leaderboard.entry.service"
    );

    const activePointsLeaderboards = await Leaderboard.find({
      type: "points",
      status: "active",
    })
      .select("_id")
      .lean();

    const breakdownKey = reasonToBreakdownKey(payload.reason);

    await Promise.all(
      activePointsLeaderboards.map((leaderboard) =>
        leaderboardEntryService.upsertPoints(leaderboard._id.toString(), {
          userId: payload.user,
          pointsDelta: payload.points,
          breakdownKey,
        }),
      ),
    );
  } catch {
    // A missing/finalized leaderboard should never block the points
    // award itself — the ledger entry above is the source of truth.
  }

  return entry;
};

const createPointsLedger = async (payload: ICreatePointsLedgerInput) => {
  const user = await User.findById(payload.user).select("_id");
  assertFound(user, "User not found", 404);

  const founderOrManager = user.role === "founder" || user.role === "manager";



  if (founderOrManager) return

  const sourceFilter = payload.sourceType && payload.sourceId
    ? {
      user: new Types.ObjectId(payload.user),
      sourceType: payload.sourceType,
      sourceId: new Types.ObjectId(payload.sourceId),
      reason: payload.reason,
    }
    : null;

  if (sourceFilter) {
    const duplicate = await PointsLedger.findOne(sourceFilter).select("_id");
    if (duplicate) {
      throw new Error("A points entry already exists for this user, source and reason");
    }
  }

  const entry = await PointsLedger.create({
    user: new Types.ObjectId(payload.user),
    sourceType: payload.sourceType,
    sourceId: payload.sourceId ? new Types.ObjectId(payload.sourceId) : undefined,
    sourceEntity: payload.sourceEntity,
    points: payload.points,
    transactionType: payload.transactionType,
    reason: payload.reason,
    description: payload.description,
    balanceAfter: payload.balanceAfter,
    balanceBefore: payload.balanceBefore,
    module: payload.module ? new Types.ObjectId(payload.module) : undefined,
    video: payload.video ? new Types.ObjectId(payload.video) : undefined,
    action: payload.action ? new Types.ObjectId(payload.action) : undefined,
    quiz: payload.quiz ? new Types.ObjectId(payload.quiz) : undefined,
    session: payload.session ? new Types.ObjectId(payload.session) : undefined,
    metadata: payload.metadata ?? {},
  });



  return entry;
};

const getPointsLedger = async (query: IPointsLedgerQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IPointsLedger> = {};

  if (query.userId) {
    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.sourceType) {
    filter.sourceType = query.sourceType;
  }

  if (query.sourceEntity) {
    filter.sourceEntity = query.sourceEntity;
  }

  if (query.reason) {
    filter.reason = query.reason;
  }

  if (query.transactionType) {
    filter.transactionType = query.transactionType;
  }

  const [data, total] = await Promise.all([
    PointsLedger.find(filter)
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PointsLedger.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSinglePointsLedger = async (entryId: string) => {
  const entry = await PointsLedger.findById(entryId).populate("user", "fullName email role");
  assertFound(entry, "Points ledger entry not found", 404);
  return entry;
};

export const pointsLedgerService = {
  createPointsLedger,
  getPointsLedger,
  getSinglePointsLedger,
  awardPoints,
  getUserTotalPoints,
};