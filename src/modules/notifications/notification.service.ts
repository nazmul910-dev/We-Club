import { QueryFilter, Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import throwServiceError from "../../utility/throwServiceError";
import { emitNotificationToUser } from "../../socket/socket";

import { NotificationTemplate } from "../notificationTemplates/notification.template.model.schema";
import { User } from "../users/users.model.schema";

import {
  ICreateNotificationFromTemplatePayload,
  ICreateNotificationPayload,
  IGetAllNotificationsQuery,
  IGetMyNotificationsQuery,
  INotification,
  NotificationChannel,
} from "./notification.interface";
import { Notification } from "./notification.model.schema";

type TemplateVariables = Record<
  string,
  string | number | boolean | null | undefined
>;

interface ITemplateFallbackPayload {
  templateKey: string;
  fallbackTitle: string;
  fallbackBody: string;

  recipient: string;
  actor?: string | undefined;

  variables?: TemplateVariables | undefined;
  channels?: NotificationChannel[] | undefined;

  relatedEntityType?: string | undefined;
  relatedEntityId?: string | undefined;
  actionUrl?: string | undefined;

  metadata?: Record<string, unknown> | undefined;
  dedupeKey?: string | undefined;
}

const NOTIFICATION_POPULATE = [
  {
    path: "recipient",
    select: "fullName email role profileImage accessTo",
  },
  {
    path: "actor",
    select: "fullName email role profileImage",
  },
  {
    path: "template",
    select: "key titleTemplate bodyTemplate channels enabled",
  },
];

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const renderPlaceholders = (
  source: string,
  variables: TemplateVariables = {},
): string => {
  return source.replace(
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
    (_match, key: string) => {
      const value = variables[key];

      if (value === undefined || value === null) {
        return "";
      }

      return String(value);
    },
  );
};

const getExistingByDedupeKey = async (dedupeKey?: string | undefined) => {
  if (!dedupeKey) {
    return null;
  }

  return Notification.findOne({ dedupeKey }).populate(NOTIFICATION_POPULATE);
};

const createNotificationRecord = async (
  payload: ICreateNotificationPayload,
  templateId?: Types.ObjectId | undefined,
) => {
  assertValidObjectId(payload.recipient, "Recipient user ID");

  if (payload.actor) {
    assertValidObjectId(payload.actor, "Actor user ID");
  }

  if (payload.relatedEntityId) {
    assertValidObjectId(payload.relatedEntityId, "Related entity ID");
  }

  const existing = await getExistingByDedupeKey(payload.dedupeKey);

  if (existing) {
    return existing;
  }

  const recipient = await User.findById(payload.recipient).select("_id");

  assertFound(recipient, "Notification recipient user not found", 404);

  const createData: Record<string, unknown> = {
    recipient: new Types.ObjectId(payload.recipient),
    type: payload.type.trim(),
    title: payload.title.trim(),
    body: payload.body.trim(),
    channels: payload.channels ?? ["in_app"],
    isRead: false,
  };

  if (payload.actor) {
    createData.actor = new Types.ObjectId(payload.actor);
  }

  if (templateId) {
    createData.template = templateId;
  }

  if (payload.relatedEntityType) {
    createData.relatedEntityType = payload.relatedEntityType;
  }

  if (payload.relatedEntityId) {
    createData.relatedEntityId = new Types.ObjectId(payload.relatedEntityId);
  }

  if (payload.actionUrl) {
    createData.actionUrl = payload.actionUrl;
  }

  if (payload.metadata !== undefined) {
    createData.metadata = payload.metadata;
  }

  if (payload.dedupeKey) {
    createData.dedupeKey = payload.dedupeKey;
  }

  try {
    const notification = await Notification.create(createData);

    await notification.populate(NOTIFICATION_POPULATE);

    if (notification.channels.includes("in_app")) {
      emitNotificationToUser(
        payload.recipient,
        notification.toObject(),
      );
    }

    return notification;
  } catch (error) {
    const maybeMongoError = error as {
      code?: number;
    };

    if (maybeMongoError.code === 11000 && payload.dedupeKey) {
      const duplicate = await getExistingByDedupeKey(payload.dedupeKey);

      if (duplicate) {
        return duplicate;
      }
    }

    throw error;
  }
};

const createNotification = async (
  payload: ICreateNotificationPayload,
) => {
  return createNotificationRecord(payload);
};

const createNotificationFromTemplate = async (
  payload: ICreateNotificationFromTemplatePayload,
) => {
  const template = await NotificationTemplate.findOne({
    key: payload.templateKey.trim().toLowerCase(),
  });

  assertFound(
    template,
    `Notification template "${payload.templateKey}" not found`,
    404,
  );

  if (!template.enabled) {
    throwServiceError(
      `Notification template "${template.key}" is disabled`,
      400,
    );
  }

  const variables = payload.variables ?? {};

  const actionUrl =
    payload.actionUrl ??
    (template.actionUrlTemplate
      ? renderPlaceholders(template.actionUrlTemplate, variables)
      : undefined);

  const notificationPayload: ICreateNotificationPayload = {
    recipient: payload.recipient,
    type: template.key,
    title: renderPlaceholders(template.titleTemplate, variables),
    body: renderPlaceholders(template.bodyTemplate, variables),
    channels: payload.channels ?? template.channels,
    ...(payload.actor ? { actor: payload.actor } : {}),
    ...(payload.relatedEntityType
      ? { relatedEntityType: payload.relatedEntityType }
      : {}),
    ...(payload.relatedEntityId
      ? { relatedEntityId: payload.relatedEntityId }
      : {}),
    ...(actionUrl ? { actionUrl } : {}),
    ...(payload.metadata !== undefined
      ? { metadata: payload.metadata }
      : {}),
    ...(payload.dedupeKey
      ? { dedupeKey: payload.dedupeKey }
      : {}),
  };

  return createNotificationRecord(
    notificationPayload,
    template._id as Types.ObjectId,
  );
};

const safeCreateNotification = async (
  payload: ICreateNotificationPayload,
) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    console.error("Notification create failed:", error);
    return null;
  }
};

const safeCreateFromTemplateOrFallback = async (
  payload: ITemplateFallbackPayload,
) => {
  try {
    const template = await NotificationTemplate.findOne({
      key: payload.templateKey.trim().toLowerCase(),
    });

    if (template && !template.enabled) {
      return null;
    }

    if (template) {
      const fromTemplatePayload: ICreateNotificationFromTemplatePayload = {
        recipient: payload.recipient,
        templateKey: template.key,
        variables: payload.variables ?? {},
        ...(payload.actor ? { actor: payload.actor } : {}),
        ...(payload.channels ? { channels: payload.channels } : {}),
        ...(payload.relatedEntityType
          ? { relatedEntityType: payload.relatedEntityType }
          : {}),
        ...(payload.relatedEntityId
          ? { relatedEntityId: payload.relatedEntityId }
          : {}),
        ...(payload.actionUrl ? { actionUrl: payload.actionUrl } : {}),
        ...(payload.metadata !== undefined
          ? { metadata: payload.metadata }
          : {}),
        ...(payload.dedupeKey
          ? { dedupeKey: payload.dedupeKey }
          : {}),
      };

      return await createNotificationFromTemplate(fromTemplatePayload);
    }

    const fallbackPayload: ICreateNotificationPayload = {
      recipient: payload.recipient,
      type: payload.templateKey.trim().toLowerCase(),
      title: payload.fallbackTitle,
      body: payload.fallbackBody,
      channels: payload.channels ?? ["in_app"],
      ...(payload.actor ? { actor: payload.actor } : {}),
      ...(payload.relatedEntityType
        ? { relatedEntityType: payload.relatedEntityType }
        : {}),
      ...(payload.relatedEntityId
        ? { relatedEntityId: payload.relatedEntityId }
        : {}),
      ...(payload.actionUrl ? { actionUrl: payload.actionUrl } : {}),
      ...(payload.metadata !== undefined
        ? { metadata: payload.metadata }
        : {}),
      ...(payload.dedupeKey
        ? { dedupeKey: payload.dedupeKey }
        : {}),
    };

    return await createNotification(fallbackPayload);
  } catch (error) {
    console.error(
      `Notification dispatch failed for "${payload.templateKey}":`,
      error,
    );

    return null;
  }
};

const buildNotificationFilter = (
  query: IGetMyNotificationsQuery,
  recipientId?: string | undefined,
): QueryFilter<INotification> => {
  const filter: QueryFilter<INotification> = {};

  if (recipientId) {
    assertValidObjectId(recipientId, "Recipient user ID");
    filter.recipient = new Types.ObjectId(recipientId);
  }

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");

    filter.$or = [
      { title: regex },
      { body: regex },
      { type: regex },
    ];
  }

  return filter;
};

const getMyNotifications = async (
  userId: string,
  query: IGetMyNotificationsQuery = {},
) => {
  const filter = buildNotificationFilter(query, userId);

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(NOTIFICATION_POPULATE),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
    data,
  };
};

const getUnreadCount = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const unreadCount = await Notification.countDocuments({
    recipient: new Types.ObjectId(userId),
    isRead: false,
  });

  return {
    unreadCount,
  };
};

const markOneAsRead = async (
  notificationId: string,
  userId: string,
) => {
  assertValidObjectId(notificationId, "Notification ID");
  assertValidObjectId(userId, "User ID");

  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(userId),
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    {
      new: true,
    },
  ).populate(NOTIFICATION_POPULATE);

  assertFound(notification, "Notification not found", 404);

  return notification;
};

const markOneAsUnread = async (
  notificationId: string,
  userId: string,
) => {
  assertValidObjectId(notificationId, "Notification ID");
  assertValidObjectId(userId, "User ID");

  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(userId),
    },
    {
      $set: {
        isRead: false,
      },
      $unset: {
        readAt: 1,
      },
    },
    {
      new: true,
    },
  ).populate(NOTIFICATION_POPULATE);

  assertFound(notification, "Notification not found", 404);

  return notification;
};

const markAllAsRead = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const now = new Date();

  const result = await Notification.updateMany(
    {
      recipient: new Types.ObjectId(userId),
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
    readAt: now,
  };
};

const getAllNotificationsAdmin = async (
  query: IGetAllNotificationsQuery = {},
) => {
  const filter = buildNotificationFilter(query, query.recipientId);

  if (query.actorId) {
    assertValidObjectId(query.actorId, "Actor user ID");
    filter.actor = new Types.ObjectId(query.actorId);
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(NOTIFICATION_POPULATE),
    Notification.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

export const notificationService = {
  createNotification,
  createNotificationFromTemplate,

  safeCreateNotification,
  safeCreateFromTemplateOrFallback,

  getMyNotifications,
  getUnreadCount,

  markOneAsRead,
  markOneAsUnread,
  markAllAsRead,

  getAllNotificationsAdmin,
};
