import { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";

import { challengePillarService } from "./challenge.pillar.service";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  if (!req.user) {
    const error = new Error("Authentication required") as Error & {
      statusCode?: number;
    };

    error.statusCode = 401;

    throw error;
  }

  const authUser = req.user as any;

  const userId = authUser.id || authUser.userId;

  if (!userId) {
    const error = new Error("Authenticated user ID is missing") as Error & {
      statusCode?: number;
    };

    error.statusCode = 401;

    throw error;
  }

  return {
    id: String(userId),
    role: String(authUser.role),
  };
};

const createChallengePillar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.createChallengePillar(
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Challenge pillar created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const seedDefaultChallengePillars = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.seedDefaultChallengePillars(
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Default challenge pillars initialized successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllChallengePillars = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.getAllChallengePillars({
      actorRole: authUser.role,

      includeArchived: req.query.includeArchived === "true",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillars retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getChallengePillarBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.getChallengePillarBySlug(
      req.params.slug as any,
      authUser.role,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateChallengePillar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.updateChallengePillar(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const publishChallengePillar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.publishChallengePillar(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moveChallengePillarToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.moveChallengePillarToDraft(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar moved to draft successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const archiveChallengePillar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await challengePillarService.archiveChallengePillar(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Challenge pillar archived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const challengePillarController = {
  createChallengePillar,
  seedDefaultChallengePillars,

  getAllChallengePillars,
  getChallengePillarBySlug,

  updateChallengePillar,

  publishChallengePillar,
  moveChallengePillarToDraft,
  archiveChallengePillar,
};
