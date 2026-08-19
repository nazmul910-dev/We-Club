import { z } from "zod";

import { NOTIFICATION_CHANNELS } from "./notification.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const notificationTypeSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(
    /^[a-z0-9_.:-]+$/i,
    "Notification type may contain only letters, numbers, _, ., :, and -",
  );

const metadataSchema = z.record(z.string(), z.unknown());

export const notificationIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const createNotificationValidation = z.object({
  body: z.object({
    recipient: mongoObjectIdSchema,

    type: notificationTypeSchema,

    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),

    channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).optional(),

    relatedEntityType: z.string().trim().min(1).max(120).optional(),
    relatedEntityId: mongoObjectIdSchema.optional(),

    actionUrl: z.string().trim().max(1000).optional(),

    metadata: metadataSchema.optional(),
    dedupeKey: z.string().trim().min(1).max(250).optional(),
  }),
});

export const createNotificationFromTemplateValidation = z.object({
  body: z.object({
    recipient: mongoObjectIdSchema,

    templateKey: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9_.:-]+$/i),

    variables: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.null(),
        ]),
      )
      .optional(),

    channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).optional(),

    relatedEntityType: z.string().trim().min(1).max(120).optional(),
    relatedEntityId: mongoObjectIdSchema.optional(),

    actionUrl: z.string().trim().max(1000).optional(),

    metadata: metadataSchema.optional(),
    dedupeKey: z.string().trim().min(1).max(250).optional(),
  }),
});

export const getMyNotificationsValidation = z.object({
  query: z.object({
    isRead: z.enum(["true", "false"]).optional(),
    type: notificationTypeSchema.optional(),
    search: z.string().trim().max(200).optional(),

    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const getAllNotificationsValidation = z.object({
  query: z.object({
    recipientId: mongoObjectIdSchema.optional(),
    actorId: mongoObjectIdSchema.optional(),

    isRead: z.enum(["true", "false"]).optional(),
    type: notificationTypeSchema.optional(),
    search: z.string().trim().max(200).optional(),

    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
