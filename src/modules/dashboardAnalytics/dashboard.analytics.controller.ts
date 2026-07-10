import { NextFunction, Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { dashboardService } from "./dashboard.analytics.services";

const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    try {
      console.log(req.user);
    const result = await dashboardService.getDashboardStats(
      req.user?.id as string,
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

export const dashboardController = {
  getDashboardStats,
};
