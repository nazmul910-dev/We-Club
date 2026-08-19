import { z } from "zod";

import { NOTIFICATION_CHANNELS } from "../notifications/notification.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const templateKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(
    /^[a-z0-9_.:-]+$/,
    "Template key must use lowercase letters, numbers, _, ., :, or -",
  );

export const notificationTemplateIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const createNotificationTemplateValidation = z.object({
  body: z.object({
    key: templateKeySchema,

    titleTemplate: z.string().trim().min(1).max(200),
    bodyTemplate: z.string().trim().min(1).max(2000),

    channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).optional(),

    actionUrlTemplate: z.string().trim().max(1000).optional(),
    description: z.string().trim().max(1000).optional(),

    enabled: z.boolean().optional(),
  }),
});

export const updateNotificationTemplateValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),

  body: z
    .object({
      titleTemplate: z.string().trim().min(1).max(200).optional(),
      bodyTemplate: z.string().trim().min(1).max(2000).optional(),

      channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).optional(),

      actionUrlTemplate: z
        .union([z.string().trim().max(1000), z.null()])
        .optional(),

      description: z
        .union([z.string().trim().max(1000), z.null()])
        .optional(),

      enabled: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

export const getNotificationTemplatesValidation = z.object({
  query: z.object({
    enabled: z.enum(["true", "false"]).optional(),
    channel: z.enum(NOTIFICATION_CHANNELS).optional(),
    search: z.string().trim().max(200).optional(),

    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
