import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import {
  IGetAllLeaderboardsQuery,
  LeaderboardPeriod,
  LeaderboardStatus,
  LeaderboardType,
} from "./leaderboard.interface";

import { leaderboardService } from "./leaderboard.service";
import { string } from "zod";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  const user = req.user;

  assertFound(user, "Authentication required", 401);

  return {
    id: user.id as string,
    role: user.role as string,
  };
};

const createLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await leaderboardService.createLeaderboard(
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,

      message: "Leaderboard created successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllLeaderboards = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IGetAllLeaderboardsQuery = {};

    if (typeof req.query.type === "string") {
      query.type = req.query.type as LeaderboardType;
    }

    if (typeof req.query.period === "string") {
      query.period = req.query.period as LeaderboardPeriod;
    }

    if (typeof req.query.status === "string") {
      query.status = req.query.status as LeaderboardStatus;
    }

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await leaderboardService.getAllLeaderboards(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboards retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await leaderboardService.getSingleLeaderboard(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard retrieved2 successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaderboardEntries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);
    const page = Number(req.query.page);
    const limit = Math.min(Number(req.query.limit) ?? 20, 100);

    const result = await leaderboardService.getLeaderboardEntries(
      String(req.params.id),
      { page, limit },
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard retrieved2 successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await leaderboardService.updateLeaderboard(
      String(req.params.id),
      req.body,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard updated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const activateLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await leaderboardService.activateLeaderboard(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard activated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const finalizeLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await leaderboardService.finalizeLeaderboard(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard finalized successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaderboardEntries = async (req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const page = Number(req.query.page)
    const limit = Number(req.query.limit)

    const result = await leaderboardService.getLeaderboardEntries(
      String(req.params.id), { page, limit }
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Leaderboard finalized successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};



export const leaderboardController = {
  createLeaderboard,

  getAllLeaderboards,
  getSingleLeaderboard,

  updateLeaderboard,
  getLeaderboardEntries,
  activateLeaderboard,
  finalizeLeaderboard,

  getLeaderboardEntries,
};
