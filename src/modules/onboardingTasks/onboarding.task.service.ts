import { QueryFilter, Types } from "mongoose";

import throwServiceError from "../../utility/throwServiceError";
import assertFound from "../../utility/assertFound";

import {
  ICreateOnboardingTask,
  IMyOnboardingChecklistItem,
  IOnboardingTask,
  IUpdateOnboardingTask,
} from "./onboarding.task.interface";

import { OnboardingTask, OnboardingTaskCompletion } from "./onboarding.task.model.schema";

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isAdminOrManager = (role?: string | undefined): boolean => {
  return role === "admin" || role === "manager" || role === "founder";
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

/* -------------------------------------------------------------------- */
/*  Admin / manager CRUD (mirrors moduleActions conventions)             */
/* -------------------------------------------------------------------- */

const createOnboardingTask = async (
  payload: ICreateOnboardingTask,
  actorId: string,
) => {
  const existing = await OnboardingTask.findOne({ order: payload.order }).lean();

  if (existing) {
    throwServiceError("A task with this order already exists", 409);
  }

  try {
    const task = await OnboardingTask.create({
      title: payload.title,
      description: payload.description,
      order: payload.order,
      trigger: payload.trigger ?? "manual",
      actionLabel: payload.actionLabel,
      actionUrl: payload.actionUrl,
      linkedVideo: payload.linkedVideo ? new Types.ObjectId(payload.linkedVideo) : undefined,
      pointsReward: payload.pointsReward ?? 5,
      status: "draft",
      createdBy: new Types.ObjectId(actorId),
    });

    return task;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError("A task with this order already exists", 409);
    }

    throw error;
  }
};

const getAllOnboardingTasks = async (actorRole?: string | undefined) => {
  const filter: QueryFilter<IOnboardingTask> = {};

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
  }

  return OnboardingTask.find(filter)
    .sort({ order: 1 })
    .populate("createdBy", "fullName email role")
    .populate("updatedBy", "fullName email role")
    .lean();
};

const updateOnboardingTask = async (
  taskId: string,
  payload: IUpdateOnboardingTask,
  actorId: string,
) => {
  assertValidObjectId(taskId, "Onboarding task ID");

  const task = await OnboardingTask.findById(taskId);

  assertFound(task, "Onboarding task not found", 404);

  if (task.status === "archived") {
    throwServiceError("Archived task cannot be updated", 400);
  }

  if (payload.order !== undefined && payload.order !== task.order) {
    const duplicate = await OnboardingTask.findOne({
      _id: { $ne: task._id },
      order: payload.order,
    }).lean();

    if (duplicate) {
      throwServiceError("A task with this order already exists", 409);
    }

    task.order = payload.order;
  }

  if (payload.title !== undefined) task.title = payload.title;
  if (payload.trigger !== undefined) task.trigger = payload.trigger;
  if (payload.pointsReward !== undefined) task.pointsReward = payload.pointsReward;

  if (payload.description === null) task.set("description", undefined);
  else if (payload.description !== undefined) task.description = payload.description;

  if (payload.actionLabel === null) task.set("actionLabel", undefined);
  else if (payload.actionLabel !== undefined) task.actionLabel = payload.actionLabel;

  if (payload.actionUrl === null) task.set("actionUrl", undefined);
  else if (payload.actionUrl !== undefined) task.actionUrl = payload.actionUrl;

  if (payload.linkedVideo === null) task.set("linkedVideo", undefined);
  else if (payload.linkedVideo !== undefined)
    task.linkedVideo = new Types.ObjectId(payload.linkedVideo);

  task.updatedBy = new Types.ObjectId(actorId);

  await task.save();

  return task;
};

const publishOnboardingTask = async (taskId: string, actorId: string) => {
  assertValidObjectId(taskId, "Onboarding task ID");

  const task = await OnboardingTask.findById(taskId);

  assertFound(task, "Onboarding task not found", 404);

  task.status = "published";
  task.publishedAt = new Date();
  task.set("archivedAt", undefined);
  task.updatedBy = new Types.ObjectId(actorId);

  await task.save();

  return task;
};

const archiveOnboardingTask = async (taskId: string, actorId: string) => {
  assertValidObjectId(taskId, "Onboarding task ID");

  const task = await OnboardingTask.findById(taskId);

  assertFound(task, "Onboarding task not found", 404);

  task.status = "archived";
  task.archivedAt = new Date();
  task.updatedBy = new Types.ObjectId(actorId);

  await task.save();

  return task;
};

/* -------------------------------------------------------------------- */
/*  User-facing checklist + completion                                   */
/* -------------------------------------------------------------------- */

/**
 * Marks a task complete for a user and awards its points, exactly
 * once. Safe to call repeatedly (e.g. re-clicking "Open") — the
 * unique (user, task) index plus pointsLedgerService.awardPoints's
 * own idempotency make this a no-op after the first call.
 */
const completeTaskForUser = async (userId: string, taskId: string) => {
  assertValidObjectId(taskId, "Onboarding task ID");

  const task = await OnboardingTask.findOne({ _id: taskId, status: "published" });

  assertFound(task, "Onboarding task not found or not published", 404);

  const alreadyCompleted = await OnboardingTaskCompletion.findOne({
    user: new Types.ObjectId(userId),
    task: task._id,
  }).lean();

  if (alreadyCompleted) {
    return { alreadyCompleted: true, pointsAwarded: 0 };
  }

  try {
    await OnboardingTaskCompletion.create({
      user: new Types.ObjectId(userId),
      task: task._id,
      pointsAwarded: task.pointsReward,
      completedAt: new Date(),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { alreadyCompleted: true, pointsAwarded: 0 };
    }

    throw error;
  }

  const { pointsLedgerService } = await import("../pointsLedger/pointsledger.service");

  await pointsLedgerService.awardPoints({
    user: userId,
    points: task.pointsReward,
    reason: "onboarding_task_complete",
    sourceType: "onboarding",
    sourceId: task._id.toString(),
    action: task._id.toString(),
    description: `Completed onboarding task: ${task.title}`,
  });

  return { alreadyCompleted: false, pointsAwarded: task.pointsReward };
};

/**
 * Auto-completes every `auto_on_login` task for a user.
 * Called from auth.service.ts right after a successful login.
 */
const completeAutoLoginTasksForUser = async (userId: string) => {
  const autoTasks = await OnboardingTask.find({
    status: "published",
    trigger: "auto_on_login",
  })
    .select("_id")
    .lean();

  for (const task of autoTasks) {
    await completeTaskForUser(userId, task._id.toString());
  }
};

/**
 * Auto-completes any `video_watch` task linked to a specific video.
 * Called from videoProgress.service.ts when a video is completed.
 */
const completeVideoWatchTasksForUser = async (userId: string, videoId: string) => {
  const linkedTasks = await OnboardingTask.find({
    status: "published",
    trigger: "video_watch",
    linkedVideo: new Types.ObjectId(videoId),
  })
    .select("_id")
    .lean();

  for (const task of linkedTasks) {
    await completeTaskForUser(userId, task._id.toString());
  }
};

const getMyChecklist = async (userId: string): Promise<IMyOnboardingChecklistItem[]> => {
  const [tasks, completions] = await Promise.all([
    OnboardingTask.find({ status: "published" }).sort({ order: 1 }).lean(),
    OnboardingTaskCompletion.find({ user: new Types.ObjectId(userId) }).lean(),
  ]);

  const completionMap = new Map(
    completions.map((completion) => [completion.task.toString(), completion]),
  );

  return tasks.map((task) => {
    const completion = completionMap.get(task._id.toString());

    return {
      _id: task._id,
      title: task.title,
      description: task.description,
      order: task.order,
      trigger: task.trigger,
      actionLabel: task.actionLabel,
      actionUrl: task.actionUrl,
      pointsReward: task.pointsReward,
      isCompleted: Boolean(completion),
      completedAt: completion?.completedAt,
    };
  });
};

export const onboardingTaskService = {
  createOnboardingTask,
  getAllOnboardingTasks,
  updateOnboardingTask,
  publishOnboardingTask,
  archiveOnboardingTask,

  getMyChecklist,
  completeTaskForUser,
  completeAutoLoginTasksForUser,
  completeVideoWatchTasksForUser,
};