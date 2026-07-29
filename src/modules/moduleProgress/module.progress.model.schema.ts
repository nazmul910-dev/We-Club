import { model, Schema } from "mongoose";

import {
  IModuleProgress,
  IModuleQuizSummary,
  IModuleRequirementSummary,
  QUIZ_PROGRESS_STATUSES,
} from "./module.progress.interface";

const requirementSummarySchema = new Schema<IModuleRequirementSummary>(
  {
    totalRequired: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    completedRequired: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    completionPercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      required: true,
    },

    completed: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const quizSummarySchema = new Schema<IModuleQuizSummary>(
  {
    status: {
      type: String,
      enum: QUIZ_PROGRESS_STATUSES,
      default: "locked",
      required: true,
    },

    attemptsUsed: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
      required: true,
    },

    maximumAttempts: {
      type: Number,
      default: 2,
      min: 2,
      max: 2,
      required: true,
    },

    bestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
    },

    passScore: {
      type: Number,
      default: 70,
      min: 70,
      max: 70,
      required: true,
    },

    passed: {
      type: Boolean,
      default: false,
      required: true,
    },

    lastAttemptAt: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const moduleProgressSchema = new Schema<IModuleProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    videoSummary: {
      type: requirementSummarySchema,

      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true,
      }),
    },

    resourceSummary: {
      type: requirementSummarySchema,

      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true,
      }),
    },

    actionSummary: {
      type: requirementSummarySchema,

      default: () => ({
        totalRequired: 0,
        completedRequired: 0,
        completionPercent: 100,
        completed: true,
      }),
    },

    quizSummary: {
      type: quizSummarySchema,

      default: () => ({
        status: "locked",
        attemptsUsed: 0,
        maximumAttempts: 2,
        bestScore: 0,
        passScore: 70,
        passed: false,
      }),
    },

    actionsUnlocked: {
      type: Boolean,
      default: false,
      required: true,
    },

    quizUnlocked: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    overallCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      required: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "moduleprogress",
    optimisticConcurrency: true,
  },
);

/**
 * One progress document per user and module.
 */
moduleProgressSchema.index(
  {
    user: 1,
    module: 1,
  },
  {
    unique: true,
  },
);

moduleProgressSchema.index({
  user: 1,
  isCompleted: 1,
  updatedAt: -1,
});

moduleProgressSchema.index({
  module: 1,
  isCompleted: 1,
});

export const ModuleProgress = model<IModuleProgress>(
  "ModuleProgress",
  moduleProgressSchema,
);
