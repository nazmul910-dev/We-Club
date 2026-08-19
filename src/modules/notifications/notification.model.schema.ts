import { model, Schema } from "mongoose";

import {
  INotification,
  NOTIFICATION_CHANNELS,
} from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    template: {
      type: Schema.Types.ObjectId,
      ref: "NotificationTemplate",
    },

    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 120,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    body: {
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

    relatedEntityType: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },

    actionUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    readAt: {
      type: Date,
    },

    dedupeKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  type: 1,
  createdAt: -1,
});

notificationSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    sparse: true,
  },
);

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
