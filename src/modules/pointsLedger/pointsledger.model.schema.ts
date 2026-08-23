import { model, Schema } from "mongoose";

import {
  IPointsLedger,
  POINTS_LEDGER_REASONS,
  POINTS_LEDGER_SOURCE_TYPES,
  POINTS_LEDGER_TYPES,
} from "./pointsledger.interface";

const pointsLedgerSchema = new Schema<IPointsLedger>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sourceType: {
      type: String,
      enum: POINTS_LEDGER_SOURCE_TYPES,
      index: true,
    },

    sourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    sourceEntity: {
      type: String,
      trim: true,
      maxlength: 120,
      index: true,
    },

    points: {
      type: Number,
      required: true,
      min: -1000000,
      max: 1000000,
    },

    transactionType: {
      type: String,
      enum: POINTS_LEDGER_TYPES,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: POINTS_LEDGER_REASONS,
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    balanceAfter: {
      type: Number,
      min: -1000000,
      max: 1000000,
    },

    balanceBefore: {
      type: Number,
      min: -1000000,
      max: 1000000,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      index: true,
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "ModuleVideo",
      index: true,
    },

    action: {
      type: Schema.Types.ObjectId,
      ref: "ModuleAction",
      index: true,
    },

    quiz: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      index: true,
    },

    session: {
      type: Schema.Types.ObjectId,
      ref: "SessionSchedule",
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "pointsledger",
  },
);

pointsLedgerSchema.index(
  { user: 1, sourceType: 1, sourceId: 1, reason: 1 },
  { unique: true, sparse: true },
);

pointsLedgerSchema.index({ user: 1, createdAt: -1 });
pointsLedgerSchema.index({ sourceType: 1, sourceId: 1 });

export const PointsLedger = model<IPointsLedger>("PointsLedger", pointsLedgerSchema);
