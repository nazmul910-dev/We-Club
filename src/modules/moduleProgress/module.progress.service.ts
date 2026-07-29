import { HydratedDocument, QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import { ModuleAction } from "../moduleActions/module.action.model.schema";
import { ModuleResource } from "../moduleResources/module.resource.model.schema";
import { ModuleVideo } from "../moduleVideos/module.video.model.schema";
import { VideoProgress } from "../videoProgress/video.progress.model.schema";

import {
  IModuleProgress,
  IModuleProgressAdminQuery,
  ISyncQuizSummary,
  ISyncRequirementSummary,
} from "./module.progress.interface";

import { ModuleProgress } from "./module.progress.model.schema";

const ACTION_COMPLETION_REQUIREMENT = 80;
const QUIZ_PASS_SCORE = 70;
const MAXIMUM_QUIZ_ATTEMPTS = 2;

type ModuleProgressDocument = HydratedDocument<IModuleProgress>;

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

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

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const clamp = (value: number, minimum: number, maximum: number): number => {
  return Math.min(Math.max(value, minimum), maximum);
};

const calculateCompletionPercent = (
  completed: number,
  total: number,
): number => {
  if (total === 0) {
    return 100;
  }

  return roundToTwoDecimals(clamp((completed / total) * 100, 0, 100));
};

const ensureCourseModuleExists = async (moduleId: string) => {
  assertValidObjectId(moduleId, "Course module ID");

  const courseModule = await CourseModule.findById(moduleId).select(
    "_id pillar title slug moduleNumber status",
  );

  assertFound(courseModule, "Course module not found", 404);

  if (courseModule.status === "archived") {
    throwServiceError("Archived module progress cannot be managed", 400);
  }

  return courseModule;
};

const createDefaultProgressData = (
  userId: string,
  moduleId: string,
): Record<string, unknown> => {
  return {
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),

    videoSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true,
    },

    resourceSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true,
    },

    actionSummary: {
      totalRequired: 0,
      completedRequired: 0,
      completionPercent: 100,
      completed: true,
    },

    quizSummary: {
      status: "locked",
      attemptsUsed: 0,
      maximumAttempts: MAXIMUM_QUIZ_ATTEMPTS,
      bestScore: 0,
      passScore: QUIZ_PASS_SCORE,
      passed: false,
    },

    actionsUnlocked: false,
    quizUnlocked: false,

    overallCompletionPercent: 0,

    isCompleted: false,

    lastCalculatedAt: new Date(),
  };
};

const getOrCreateModuleProgress = async (
  userId: string,
  moduleId: string,
): Promise<ModuleProgressDocument> => {
  assertValidObjectId(userId, "User ID");

  await ensureCourseModuleExists(moduleId);

  const filter: QueryFilter<IModuleProgress> = {
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),
  };

  const existingProgress = await ModuleProgress.findOne(filter);

  if (existingProgress) {
    return existingProgress;
  }

  try {
    return await ModuleProgress.create(
      createDefaultProgressData(userId, moduleId),
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const progress = await ModuleProgress.findOne(filter);

    assertFound(progress, "Module progress could not be created", 500);

    return progress;
  }
};

const recalculateDerivedFields = (progress: ModuleProgressDocument): void => {
  /**
   * Resources are part of the required
   * progression after videos.
   */
  progress.actionsUnlocked =
    progress.videoSummary.completed && progress.resourceSummary.completed;

  /**
   * Required action threshold is 80%.
   */
  const requiredActionsCompleted =
    progress.actionSummary.totalRequired === 0 ||
    progress.actionSummary.completionPercent >= ACTION_COMPLETION_REQUIREMENT;

  progress.actionSummary.completed = requiredActionsCompleted;

  progress.quizUnlocked = progress.actionsUnlocked && requiredActionsCompleted;

  if (progress.quizSummary.passed) {
    progress.quizSummary.status = "passed";
  } else if (!progress.quizUnlocked) {
    progress.quizSummary.status = "locked";
  } else if (progress.quizSummary.attemptsUsed === 0) {
    progress.quizSummary.status = "unlocked";
  } else if (progress.quizSummary.attemptsUsed < MAXIMUM_QUIZ_ATTEMPTS) {
    progress.quizSummary.status = "in_progress";
  } else {
    progress.quizSummary.status = "failed";
  }

  const videoStagePercent = progress.videoSummary.completionPercent;

  const resourceStagePercent = progress.resourceSummary.completionPercent;

  /**
   * 80% required action completion means
   * the action stage is 100% complete.
   */
  const actionStagePercent =
    progress.actionSummary.totalRequired === 0
      ? 100
      : clamp(
          (progress.actionSummary.completionPercent /
            ACTION_COMPLETION_REQUIREMENT) *
            100,
          0,
          100,
        );

  const quizStagePercent = progress.quizSummary.passed ? 100 : 0;

  progress.overallCompletionPercent = roundToTwoDecimals(
    (videoStagePercent +
      resourceStagePercent +
      actionStagePercent +
      quizStagePercent) /
      4,
  );

  const moduleCompleted =
    progress.videoSummary.completed &&
    progress.resourceSummary.completed &&
    requiredActionsCompleted &&
    progress.quizSummary.passed;

  const newlyCompleted = !progress.isCompleted && moduleCompleted;

  progress.isCompleted = moduleCompleted;

  if (newlyCompleted) {
    progress.completedAt = new Date();
  }

  if (!moduleCompleted) {
    progress.set("completedAt", undefined);
  }

  progress.lastCalculatedAt = new Date();
};

const refreshModuleProgress = async (userId: string, moduleId: string) => {
  const progress = await getOrCreateModuleProgress(userId, moduleId);

  const moduleObjectId = new Types.ObjectId(moduleId);

  const userObjectId = new Types.ObjectId(userId);

  const requiredVideos = await ModuleVideo.find({
    module: moduleObjectId,
    status: "published",
    isRequired: true,
  })
    .select("_id")
    .lean();

  const requiredVideoIds = requiredVideos.map((video) => video._id);

  const [
    completedRequiredVideos,
    totalRequiredResources,
    totalRequiredActions,
  ] = await Promise.all([
    requiredVideoIds.length === 0
      ? Promise.resolve(0)
      : VideoProgress.countDocuments({
          user: userObjectId,

          video: {
            $in: requiredVideoIds,
          },

          isCompleted: true,
        }),

    ModuleResource.countDocuments({
      module: moduleObjectId,
      status: "published",
      isRequired: true,
    }),

    ModuleAction.countDocuments({
      module: moduleObjectId,
      status: "published",
      isRequired: true,
    }),
  ]);

  const totalRequiredVideos = requiredVideoIds.length;

  progress.set("videoSummary", {
    totalRequired: totalRequiredVideos,

    completedRequired: completedRequiredVideos,

    completionPercent: calculateCompletionPercent(
      completedRequiredVideos,
      totalRequiredVideos,
    ),

    completed:
      totalRequiredVideos === 0 ||
      completedRequiredVideos >= totalRequiredVideos,
  });

  const completedResources = Math.min(
    progress.resourceSummary.completedRequired,
    totalRequiredResources,
  );

  progress.set("resourceSummary", {
    totalRequired: totalRequiredResources,

    completedRequired: completedResources,

    completionPercent: calculateCompletionPercent(
      completedResources,
      totalRequiredResources,
    ),

    completed:
      totalRequiredResources === 0 ||
      completedResources >= totalRequiredResources,
  });

  const completedActions = Math.min(
    progress.actionSummary.completedRequired,
    totalRequiredActions,
  );

  const actionCompletionPercent = calculateCompletionPercent(
    completedActions,
    totalRequiredActions,
  );

  progress.set("actionSummary", {
    totalRequired: totalRequiredActions,

    completedRequired: completedActions,

    completionPercent: actionCompletionPercent,

    completed:
      totalRequiredActions === 0 ||
      actionCompletionPercent >= ACTION_COMPLETION_REQUIREMENT,
  });

  recalculateDerivedFields(progress);

  await progress.save();

  return progress.populate([
    {
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name title slug status",
      },
    },
  ]);
};

/**
 * Call this from future ResourceProgress
 * service after server confirms resource
 * completion.
 */
const syncResourceSummary = async (input: ISyncRequirementSummary) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId,
  );

  const totalRequired = Math.max(0, input.totalRequired);

  const completedRequired = clamp(input.completedRequired, 0, totalRequired);

  const completionPercent = calculateCompletionPercent(
    completedRequired,
    totalRequired,
  );

  progress.set("resourceSummary", {
    totalRequired,

    completedRequired,

    completionPercent,

    completed: totalRequired === 0 || completedRequired >= totalRequired,
  });

  recalculateDerivedFields(progress);

  await progress.save();

  return progress;
};

/**
 * Call this from future ActionProgress
 * service after server confirms action
 * completion.
 */
const syncActionSummary = async (input: ISyncRequirementSummary) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId,
  );

  const totalRequired = Math.max(0, input.totalRequired);

  const completedRequired = clamp(input.completedRequired, 0, totalRequired);

  const completionPercent = calculateCompletionPercent(
    completedRequired,
    totalRequired,
  );

  progress.set("actionSummary", {
    totalRequired,

    completedRequired,

    completionPercent,

    completed:
      totalRequired === 0 || completionPercent >= ACTION_COMPLETION_REQUIREMENT,
  });

  recalculateDerivedFields(progress);

  await progress.save();

  return progress;
};

/**
 * Called from QuizAttempt service.
 */
const syncQuizSummary = async (input: ISyncQuizSummary) => {
  const progress = await getOrCreateModuleProgress(
    input.userId,
    input.moduleId,
  );

  const attemptsUsed = clamp(input.attemptsUsed, 0, MAXIMUM_QUIZ_ATTEMPTS);

  const bestScore = clamp(
    Math.max(progress.quizSummary.bestScore, input.bestScore),
    0,
    100,
  );

  progress.quizSummary.attemptsUsed = attemptsUsed;

  progress.quizSummary.maximumAttempts = MAXIMUM_QUIZ_ATTEMPTS;

  progress.quizSummary.bestScore = bestScore;

  progress.quizSummary.passScore = QUIZ_PASS_SCORE;

  progress.quizSummary.passed =
    progress.quizSummary.passed || input.passed || bestScore >= QUIZ_PASS_SCORE;

  if (input.lastAttemptAt !== undefined) {
    progress.quizSummary.lastAttemptAt = input.lastAttemptAt;
  }

  recalculateDerivedFields(progress);

  await progress.save();

  return progress;
};

const getMyModuleProgress = async (userId: string, moduleId: string) => {
  return refreshModuleProgress(userId, moduleId);
};

const getMyAllModuleProgress = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const filter: QueryFilter<IModuleProgress> = {
    user: new Types.ObjectId(userId),
  };

  return ModuleProgress.find(filter)
    .sort({
      updatedAt: -1,
    })
    .populate({
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name title slug status",
      },
    });
};

const getUserModuleProgress = async (userId: string, moduleId: string) => {
  return refreshModuleProgress(userId, moduleId);
};

const getAllModuleProgress = async (query: IModuleProgressAdminQuery) => {
  const filter: QueryFilter<IModuleProgress> = {};

  if (query.userId) {
    assertValidObjectId(query.userId, "User ID");

    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.moduleId) {
    assertValidObjectId(query.moduleId, "Course module ID");

    filter.module = new Types.ObjectId(query.moduleId);
  }

  if (query.isCompleted !== undefined) {
    filter.isCompleted = query.isCompleted;
  }

  const page = query.page ?? 1;

  const limit = query.limit ?? 20;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    ModuleProgress.find(filter)
      .sort({
        updatedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email role profileImage")
      .populate({
        path: "module",

        select: "title slug moduleNumber pillar status",

        populate: {
          path: "pillar",
          model: "ChallengePillar",

          select: "name title slug status",
        },
      }),

    ModuleProgress.countDocuments(filter),
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

export const moduleProgressService = {
  refreshModuleProgress,

  syncResourceSummary,
  syncActionSummary,
  syncQuizSummary,

  getMyModuleProgress,
  getMyAllModuleProgress,

  getUserModuleProgress,
  getAllModuleProgress,
};
