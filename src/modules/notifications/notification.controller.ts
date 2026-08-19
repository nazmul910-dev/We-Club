import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";

import {
  ICreateNotificationFromTemplatePayload,
  ICreateNotificationPayload,
  IGetAllNotificationsQuery,
  IGetMyNotificationsQuery,
} from "./notification.interface";
import { notificationService } from "./notification.service";

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

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

const parsePositiveNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildMyQuery = (req: Request): IGetMyNotificationsQuery => {
  const query: IGetMyNotificationsQuery = {};

  const isRead = parseBoolean(req.query.isRead);
  if (isRead !== undefined) {
    query.isRead = isRead;
  }

  if (typeof req.query.type === "string") {
    query.type = req.query.type;
  }

  if (typeof req.query.search === "string") {
    query.search = req.query.search;
  }

  const page = parsePositiveNumber(req.query.page);
  if (page !== undefined) {
    query.page = page;
  }

  const limit = parsePositiveNumber(req.query.limit);
  if (limit !== undefined) {
    query.limit = limit;
  }

  return query;
};

const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationService.getMyNotifications(
      authUser.id,
      buildMyQuery(req),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notifications retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationService.getUnreadCount(authUser.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Unread notification count retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markOneAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationService.markOneAsRead(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markOneAsUnread = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationService.markOneAsUnread(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Notification marked as unread",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const result = await notificationService.markAllAsRead(authUser.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createManualNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const payload = req.body as ICreateNotificationPayload;

    const result = await notificationService.createNotification({
      ...payload,
      actor: authUser.id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Notification created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createFromTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const payload = req.body as ICreateNotificationFromTemplatePayload;

    const result = await notificationService.createNotificationFromTemplate({
      ...payload,
      actor: authUser.id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Notification created from template successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllNotificationsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    getAuthUser(req);

    const query: IGetAllNotificationsQuery = buildMyQuery(req);

    if (typeof req.query.recipientId === "string") {
      query.recipientId = req.query.recipientId;
    }

    if (typeof req.query.actorId === "string") {
      query.actorId = req.query.actorId;
    }

    const result = await notificationService.getAllNotificationsAdmin(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All notifications retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const notificationController = {
  getMyNotifications,
  getMyUnreadCount,

  markOneAsRead,
  markOneAsUnread,
  markAllAsRead,

  createManualNotification,
  createFromTemplate,
  getAllNotificationsAdmin,
};
