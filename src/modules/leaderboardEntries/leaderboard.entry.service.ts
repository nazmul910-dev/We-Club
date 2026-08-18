import mongoose, { Types } from "mongoose";

import throwServiceError from "../../utility/throwServiceError";
import assertFound from "../../utility/assertFound";

import {
  IGetLeaderboardEntriesQuery,
  IUpsertLeaderboardPointsPayload,
} from "./leaderboard.entry.interface";

import { LeaderboardEntry } from "./leaderboard.entry.model.schema";

import { Leaderboard } from "../leaderboards/leaderboard.model.schema";
import { leaderboardService } from "../leaderboards/leaderboard.service";

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const ensureEditableLeaderboard = async (leaderboardId: string) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");

  const leaderboard = await Leaderboard.findById(leaderboardId);

  assertFound(leaderboard, "Leaderboard not found", 404);

  if (leaderboard.status === "finalized") {
    throwServiceError("Finalized leaderboard cannot be modified", 400);
  }

  return leaderboard;
};


const upsertPoints = async (
  leaderboardId: string,
  payload: IUpsertLeaderboardPointsPayload,
) => {
  await ensureEditableLeaderboard(leaderboardId);

  assertValidObjectId(payload.userId, "User ID");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const incFields: Record<string, number> = {
      points: payload.pointsDelta,
    };

    if (payload.breakdownKey) {
      incFields[`breakdown.${payload.breakdownKey}`] = payload.pointsDelta;
    }

    const entry = await LeaderboardEntry.findOneAndUpdate(
      {
        leaderboard: leaderboardId,
        user: payload.userId,
      },
      {
        $inc: incFields,
        $set: { lastUpdatedAt: new Date() },
      },
      {
        upsert: true,
        new: true,
        session,
        setDefaultsOnInsert: true,
      },
    );

    await session.commitTransaction();

    return entry;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};

const getLeaderboardEntries = async (
  leaderboardId: string,
  query: IGetLeaderboardEntriesQuery,
) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");

  const page = query.page ?? 1;

  const limit = query.limit ?? 50;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    LeaderboardEntry.find({ leaderboard: leaderboardId })
      .sort({ rank: 1, points: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email role profileImage"),

    LeaderboardEntry.countDocuments({ leaderboard: leaderboardId }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),
    },

    data: records,
  };
};

const getSingleUserEntry = async (leaderboardId: string, userId: string) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");
  assertValidObjectId(userId, "User ID");

  const entry = await LeaderboardEntry.findOne({
    leaderboard: leaderboardId,
    user: userId,
  }).populate("user", "fullName email role profileImage");

  assertFound(entry, "Entry not found for this user in this leaderboard", 404);

  return entry;
};

const getMyEntry = async (leaderboardId: string, userId: string) => {
  return getSingleUserEntry(leaderboardId, userId);
};

const removeEntry = async (leaderboardId: string, userId: string) => {
  await ensureEditableLeaderboard(leaderboardId);

  assertValidObjectId(userId, "User ID");

  const entry = await LeaderboardEntry.findOneAndDelete({
    leaderboard: leaderboardId,
    user: userId,
  });

  assertFound(entry, "Entry not found", 404);

  return entry;
};


const recalculateRanks = async (leaderboardId: string) => {
  await ensureEditableLeaderboard(leaderboardId);

  const updatedEntries =
    await leaderboardService.recalculateLeaderboardRanks(leaderboardId);

  return { updatedEntries };
};

export const leaderboardEntryService = {
  upsertPoints,

  getLeaderboardEntries,
  getSingleUserEntry,
  getMyEntry,

  removeEntry,

  recalculateRanks,
};
