import { NextFunction, Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { dashboardService } from "./dashboard.analytics.services";
import { UserRole } from "../users/user.interface";

const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await dashboardService.getDashboardStats(
      req.user?.id as string,
      req.user?.role as UserRole,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Dashboard statistics retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTopPromoters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await dashboardService.getTopPromoters();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Top promoters retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getListingsViewsAnaliticsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      throw new Error("User not authenticated");
    }

    const userId = user.id as string;
    const role = user.role;

    const result =
      await dashboardService.getListingsViewsAnalytics(
        userId,
        role,
      );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message:
        "Listings views analitics generatred sucessfully retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const dashboardController = {
  getDashboardStats,
  getTopPromoters,
  getListingsViewsAnaliticsController
};
