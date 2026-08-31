import { model, Schema } from "mongoose";

import {
  IOnboardingTask,
  IOnboardingTaskCompletion,
  ONBOARDING_TASK_STATUSES,
  ONBOARDING_TASK_TRIGGERS,
} from "./onboarding.task.interface";

const onboardingTaskSchema = new Schema<IOnboardingTask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    trigger: {
      type: String,
      enum: ONBOARDING_TASK_TRIGGERS,
      default: "manual",
      required: true,
    },

    actionLabel: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    actionUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    linkedVideo: {
      type: Schema.Types.ObjectId,
      ref: "ModuleVideo",
    },

    pointsReward: {
      type: Number,
      default: 5,
      min: 0,
      max: 1000,
    },

    status: {
      type: String,
      enum: ONBOARDING_TASK_STATUSES,
      default: "draft",
      index: true,
    },

    publishedAt: {
      type: Date,
    },

    archivedAt: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "onboardingtasks",
  },
);

onboardingTaskSchema.index({ order: 1 }, { unique: true });
onboardingTaskSchema.index({ status: 1, order: 1 });

export const OnboardingTask = model<IOnboardingTask>(
  "OnboardingTask",
  onboardingTaskSchema,
);

const onboardingTaskCompletionSchema = new Schema<IOnboardingTaskCompletion>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    task: {
      type: Schema.Types.ObjectId,
      ref: "OnboardingTask",
      required: true,
      index: true,
    },

    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "onboardingtaskcompletions",
  },
);

onboardingTaskCompletionSchema.index({ user: 1, task: 1 }, { unique: true });

export const OnboardingTaskCompletion = model<IOnboardingTaskCompletion>(
  "OnboardingTaskCompletion",
  onboardingTaskCompletionSchema,
);