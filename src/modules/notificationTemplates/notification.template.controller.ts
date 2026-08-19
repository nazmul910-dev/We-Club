import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import {
  ICreateNotificationTemplatePayload,
  INotificationTemplateQuery,
  IUpdateNotificationTemplatePayload,
} from "./notification.template.interface";
import { notificationTemplateService } from "./notification.template.service";
import { NotificationChannel } from "../notifications/notification.interface";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: INotificationTemplateQuery = {};

    if (req.query.enabled === "true") {
      query.enabled = true;
    }

    if (req.query.enabled === "false") {
      query.enabled = false;
    }

    if (typeof req.query.channel === "string") {
      query.channel = req.query.channel as NotificationChannel;
    }

    if (typeof req.query.search === "string") {
      query.search = req.query.search;
    }

    if (typeof req.query.page === "string") {
      query.page = Number(req.query.page);
    }

    if (typeof req.query.limit === "string") {
      query.limit = Number(req.query.limit);
    }

    const result = await notificationTemplateService.getTemplates(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification templates retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const result = await notificationTemplateService.getSingleTemplate(
      String(req.params.id),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification template retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationTemplateService.createTemplate(
      req.body as ICreateNotificationTemplatePayload,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Notification template created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationTemplateService.updateTemplate(
      String(req.params.id),
      req.body as IUpdateNotificationTemplatePayload,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification template updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const notificationTemplateController = {
  getTemplates,
  getSingleTemplate,
  createTemplate,
  updateTemplate,
};
