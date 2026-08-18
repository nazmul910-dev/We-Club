import mongoose, { QueryFilter, Types } from "mongoose";

import throwServiceError from "../../utility/throwServiceError";
import assertFound from "../../utility/assertFound";

import {
  ICreateLeaderboardPayload,
  IGetAllLeaderboardsQuery,
  ILeaderboard,
  IUpdateLeaderboardPayload,
} from "./leaderboard.interface";

import { Leaderboard } from "./leaderboard.model.schema";

import { LeaderboardEntry } from "../leaderboardEntries/leaderboard.entry.model.schema";

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const createLeaderboard = async (
  payload: ICreateLeaderboardPayload,
  createdByUserId: string,
) => {
  assertValidObjectId(createdByUserId, "User ID");

  if (new Date(payload.startAt) >= new Date(payload.endAt)) {
    throwServiceError("startAt must be before endAt", 400);
  }

  try {
    const leaderboard = await Leaderboard.create({
      title: payload.title,
      type: payload.type,
      period: payload.period,

      startAt: payload.startAt,
      endAt: payload.endAt,

      description: payload.description,

      status: "draft",

      createdBy: new Types.ObjectId(createdByUserId),
      updatedBy: new Types.ObjectId(createdByUserId),
    });

    return leaderboard;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "An active leaderboard already exists for this type and period",
        409,
      );
    }

    throw error;
  }
};

const getSingleLeaderboard = async (leaderboardId: string) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");

  const leaderboard = await Leaderboard.findById(leaderboardId);

  assertFound(leaderboard, "Leaderboard not found", 404);

  return leaderboard;
};

const getAllLeaderboards = async (query: IGetAllLeaderboardsQuery) => {
  const filter: QueryFilter<ILeaderboard> = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.period) {
    filter.period = query.period;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = query.page ?? 1;

  const limit = query.limit ?? 20;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Leaderboard.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role"),

    Leaderboard.countDocuments(filter),
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

const updateLeaderboard = async (
  leaderboardId: string,
  payload: IUpdateLeaderboardPayload,
  updatedByUserId: string,
) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");
  assertValidObjectId(updatedByUserId, "User ID");

  const leaderboard = await Leaderboard.findById(leaderboardId);

  assertFound(leaderboard, "Leaderboard not found", 404);


  if (leaderboard.status === "finalized") {
    throwServiceError("Finalized leaderboard cannot be edited", 400);
  }

  const nextStartAt = payload.startAt ?? leaderboard.startAt;
  const nextEndAt = payload.endAt ?? leaderboard.endAt;

  if (new Date(nextStartAt) >= new Date(nextEndAt)) {
    throwServiceError("startAt must be before endAt", 400);
  }

  if (payload.title !== undefined) {
    leaderboard.title = payload.title;
  }

  if (payload.description !== undefined) {
    leaderboard.description = payload.description;
  }

  if (payload.startAt !== undefined) {
    leaderboard.startAt = payload.startAt;
  }

  if (payload.endAt !== undefined) {
    leaderboard.endAt = payload.endAt;
  }

  leaderboard.updatedBy = new Types.ObjectId(updatedByUserId);

  await leaderboard.save();

  return leaderboard;
};

const activateLeaderboard = async (
  leaderboardId: string,
  updatedByUserId: string,
) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");
  assertValidObjectId(updatedByUserId, "User ID");

  const leaderboard = await Leaderboard.findById(leaderboardId);

  assertFound(leaderboard, "Leaderboard not found", 404);

  if (leaderboard.status === "finalized") {
    throwServiceError("Finalized leaderboard cannot be reactivated", 400);
  }

  if (leaderboard.status === "active") {
    return leaderboard;
  }


  const existingActiveLeaderboard = await Leaderboard.findOne({
    _id: { $ne: leaderboard._id },
    type: leaderboard.type,
    period: leaderboard.period,
    status: "active",
  });

  if (existingActiveLeaderboard) {
    throwServiceError(
      `An active leaderboard already exists for type "${leaderboard.type}" and period "${leaderboard.period}"`,
      409,
    );
  }

  leaderboard.status = "active";
  leaderboard.updatedBy = new Types.ObjectId(updatedByUserId);

  try {
    await leaderboard.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "An active leaderboard already exists for this type and period",
        409,
      );
    }

    throw error;
  }

  return leaderboard;
};


const recalculateLeaderboardRanks = async (leaderboardId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const entries = await LeaderboardEntry.find({ leaderboard: leaderboardId })
      .sort({ points: -1, updatedAt: 1 })
      .session(session);

    const bulkOperations = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { rank: index + 1 } },
      },
    }));

    if (bulkOperations.length > 0) {
      await LeaderboardEntry.bulkWrite(bulkOperations, { session });
    }

    await session.commitTransaction();

    return entries.length;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};

const finalizeLeaderboard = async (
  leaderboardId: string,
  updatedByUserId: string,
) => {
  assertValidObjectId(leaderboardId, "Leaderboard ID");
  assertValidObjectId(updatedByUserId, "User ID");

  const leaderboard = await Leaderboard.findById(leaderboardId);

  assertFound(leaderboard, "Leaderboard not found", 404);


  if (leaderboard.status === "finalized") {
    return leaderboard;
  }

  await recalculateLeaderboardRanks(leaderboardId);

  leaderboard.status = "finalized";
  leaderboard.updatedBy = new Types.ObjectId(updatedByUserId);

  await leaderboard.save();

  return leaderboard;
};

export const leaderboardService = {
  createLeaderboard,

  getSingleLeaderboard,
  getAllLeaderboards,

  updateLeaderboard,

  activateLeaderboard,
  finalizeLeaderboard,

  recalculateLeaderboardRanks,
};
