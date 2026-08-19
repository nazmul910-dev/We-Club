import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import { IGetLeaderboardEntriesQuery } from "./leaderboard.entry.interface";

import { leaderboardEntryService } from "./leaderboard.entry.service";

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


const upsertPoints = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await leaderboardEntryService.upsertPoints(
      String(req.params.leaderboardId),
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard points updated successfully",

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

    const query: IGetLeaderboardEntriesQuery = {};

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await leaderboardEntryService.getLeaderboardEntries(
      String(req.params.leaderboardId),
      query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard entries retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = getAuthUser(req);

    const result = await leaderboardEntryService.getMyEntry(
      String(req.params.leaderboardId),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Your leaderboard entry retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleUserEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await leaderboardEntryService.getSingleUserEntry(
      String(req.params.leaderboardId),
      String(req.params.userId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "User leaderboard entry retrieved successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const removeEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await leaderboardEntryService.removeEntry(
      String(req.params.leaderboardId),
      String(req.params.userId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard entry removed successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateRanks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await leaderboardEntryService.recalculateRanks(
      String(req.params.leaderboardId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,

      message: "Leaderboard ranks recalculated successfully",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const leaderboardEntryController = {
  upsertPoints,

  getLeaderboardEntries,
  getMyEntry,
  getSingleUserEntry,

  removeEntry,

  recalculateRanks,
};
