import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import { onboardingTaskService } from "./onboarding.task.service";

const throwControllerError = (message: string, status: number): never => {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  throw error;
};

const getAuthUser = (req: Request): { id: string; role: string } => {
  const user = req.user;

  if (!user) {
    return throwControllerError("Authentication required", 401);
  }

  return { id: user.id as string, role: user.role as string };
};

const createOnboardingTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.createOnboardingTask(req.body, authUser.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Onboarding task created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOnboardingTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role as string | undefined;

    const result = await onboardingTaskService.getAllOnboardingTasks(role);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Onboarding tasks retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOnboardingTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.updateOnboardingTask(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Onboarding task updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishOnboardingTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.publishOnboardingTask(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Onboarding task published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archiveOnboardingTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.archiveOnboardingTask(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Onboarding task archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.getMyChecklist(authUser.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checklist retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const completeMyTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await onboardingTaskService.completeTaskForUser(
      authUser.id,
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.alreadyCompleted
        ? "Task was already completed"
        : `Task completed — ${result.pointsAwarded} points awarded`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const onboardingTaskController = {
  createOnboardingTask,
  getAllOnboardingTasks,
  updateOnboardingTask,
  publishOnboardingTask,
  archiveOnboardingTask,

  getMyChecklist,
  completeMyTask,
};