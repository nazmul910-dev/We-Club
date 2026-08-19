import { model, Schema } from "mongoose";

import { NOTIFICATION_CHANNELS } from "../notifications/notification.interface";
import { INotificationTemplate } from "./notification.template.interface";

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      index: true,
    },

    titleTemplate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    bodyTemplate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    channels: {
      type: [String],
      enum: NOTIFICATION_CHANNELS,
      default: ["in_app"],
      required: true,
    },

    actionUrlTemplate: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    enabled: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "notificationtemplates",
  },
);

notificationTemplateSchema.index({
  enabled: 1,
  createdAt: -1,
});

export const NotificationTemplate = model<INotificationTemplate>(
  "NotificationTemplate",
  notificationTemplateSchema,
);
