import { Types } from "mongoose";

export const NOTIFICATION_CHANNELS = ["in_app", "email", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface INotification {
  recipient: Types.ObjectId;
  actor?: Types.ObjectId | undefined;
  template?: Types.ObjectId | undefined;

  type: string;
  title: string;
  body: string;

  channels: NotificationChannel[];

  relatedEntityType?: string | undefined;
  relatedEntityId?: Types.ObjectId | undefined;
  actionUrl?: string | undefined;

  metadata?: Record<string, unknown> | undefined;

  isRead: boolean;
  readAt?: Date | undefined;

  dedupeKey?: string | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateNotificationPayload {
  recipient: string;
  actor?: string | undefined;

  type: string;
  title: string;
  body: string;

  channels?: NotificationChannel[] | undefined;

  relatedEntityType?: string | undefined;
  relatedEntityId?: string | undefined;
  actionUrl?: string | undefined;

  metadata?: Record<string, unknown> | undefined;
  dedupeKey?: string | undefined;
}

export interface ICreateNotificationFromTemplatePayload {
  recipient: string;
  actor?: string | undefined;

  templateKey: string;
  variables?: Record<string, string | number | boolean | null | undefined> | undefined;

  channels?: NotificationChannel[] | undefined;

  relatedEntityType?: string | undefined;
  relatedEntityId?: string | undefined;
  actionUrl?: string | undefined;

  metadata?: Record<string, unknown> | undefined;
  dedupeKey?: string | undefined;
}

export interface IGetMyNotificationsQuery {
  isRead?: boolean | undefined;
  type?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface IGetAllNotificationsQuery extends IGetMyNotificationsQuery {
  recipientId?: string | undefined;
  actorId?: string | undefined;
}
