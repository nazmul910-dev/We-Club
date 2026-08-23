import { QueryFilter, Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import { User } from "../users/users.model.schema";

import {
  ICreatePointsLedgerInput,
  IPointsLedger,
  IPointsLedgerQuery,
} from "./pointsledger.interface";
import { PointsLedger } from "./pointsledger.model.schema";

const createPointsLedger = async (payload: ICreatePointsLedgerInput) => {
  const user = await User.findById(payload.user).select("_id");
  assertFound(user, "User not found", 404);

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
};
