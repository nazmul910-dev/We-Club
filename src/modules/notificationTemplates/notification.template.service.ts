import { QueryFilter, Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import throwServiceError from "../../utility/throwServiceError";

import { NOTIFICATION_CHANNELS } from "../notifications/notification.interface";
import {
  ICreateNotificationTemplatePayload,
  INotificationTemplate,
  INotificationTemplateQuery,
  IUpdateNotificationTemplatePayload,
} from "./notification.template.interface";
import { NotificationTemplate } from "./notification.template.model.schema";

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const TEMPLATE_POPULATE = [
  {
    path: "createdBy",
    select: "fullName email role profileImage",
  },
  {
    path: "updatedBy",
    select: "fullName email role profileImage",
  },
];

const createTemplate = async (
  payload: ICreateNotificationTemplatePayload,
  actorId: string,
) => {
  assertValidObjectId(actorId, "Authenticated user ID");

  const key = payload.key.trim().toLowerCase();

  const existing = await NotificationTemplate.findOne({ key });

  if (existing) {
    throwServiceError(`Notification template key "${key}" already exists`, 409);
  }

  const template = await NotificationTemplate.create({
    key,
    titleTemplate: payload.titleTemplate,
    bodyTemplate: payload.bodyTemplate,
    channels: payload.channels ?? ["in_app"],
    ...(payload.actionUrlTemplate !== undefined
      ? { actionUrlTemplate: payload.actionUrlTemplate }
      : {}),
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    enabled: payload.enabled ?? true,
    createdBy: new Types.ObjectId(actorId),
    updatedBy: new Types.ObjectId(actorId),
  });

  return template.populate(TEMPLATE_POPULATE);
};

const getTemplates = async (
  query: INotificationTemplateQuery = {},
) => {
  const filter: QueryFilter<INotificationTemplate> = {};

  if (query.enabled !== undefined) {
    filter.enabled = query.enabled;
  }

  if (query.channel) {
    filter.channels = query.channel;
  }

  if (query.search) {
    const regex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    filter.$or = [
      { key: regex },
      { titleTemplate: regex },
      { bodyTemplate: regex },
      { description: regex },
    ];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    NotificationTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(TEMPLATE_POPULATE),
    NotificationTemplate.countDocuments(filter),
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

const getSingleTemplate = async (templateId: string) => {
  assertValidObjectId(templateId, "Notification template ID");

  const template = await NotificationTemplate.findById(templateId).populate(
    TEMPLATE_POPULATE,
  );

  assertFound(template, "Notification template not found", 404);

  return template;
};

const updateTemplate = async (
  templateId: string,
  payload: IUpdateNotificationTemplatePayload,
  actorId: string,
) => {
  assertValidObjectId(templateId, "Notification template ID");
  assertValidObjectId(actorId, "Authenticated user ID");

  const template = await NotificationTemplate.findById(templateId);

  assertFound(template, "Notification template not found", 404);

  if (payload.titleTemplate !== undefined) {
    template.titleTemplate = payload.titleTemplate;
  }

  if (payload.bodyTemplate !== undefined) {
    template.bodyTemplate = payload.bodyTemplate;
  }

  if (payload.channels !== undefined) {
    template.channels = payload.channels;
  }

  if (payload.actionUrlTemplate !== undefined) {
    if (payload.actionUrlTemplate === null) {
      template.actionUrlTemplate = undefined;
    } else {
      template.actionUrlTemplate = payload.actionUrlTemplate;
    }
  }

  if (payload.description !== undefined) {
    if (payload.description === null) {
      template.description = undefined;
    } else {
      template.description = payload.description;
    }
  }

  if (payload.enabled !== undefined) {
    template.enabled = payload.enabled;
  }

  template.updatedBy = new Types.ObjectId(actorId);

  await template.save();

  return template.populate(TEMPLATE_POPULATE);
};

const getTemplateByKey = async (key: string) => {
  return NotificationTemplate.findOne({
    key: key.trim().toLowerCase(),
  });
};

export const notificationTemplateService = {
  createTemplate,
  getTemplates,
  getSingleTemplate,
  updateTemplate,
  getTemplateByKey,
};

export { NOTIFICATION_CHANNELS };
