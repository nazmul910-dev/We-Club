import { Types } from "mongoose";

import { NotificationChannel } from "../notifications/notification.interface";

export interface INotificationTemplate {
  key: string;
  titleTemplate: string;
  bodyTemplate: string;

  channels: NotificationChannel[];

  actionUrlTemplate?: string | undefined;
  description?: string | undefined;

  enabled: boolean;

  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateNotificationTemplatePayload {
  key: string;
  titleTemplate: string;
  bodyTemplate: string;

  channels?: NotificationChannel[] | undefined;

  actionUrlTemplate?: string | undefined;
  description?: string | undefined;

  enabled?: boolean | undefined;
}

export interface IUpdateNotificationTemplatePayload {
  titleTemplate?: string | undefined;
  bodyTemplate?: string | undefined;

  channels?: NotificationChannel[] | undefined;

  actionUrlTemplate?: string | null | undefined;
  description?: string | null | undefined;

  enabled?: boolean | undefined;
}

export interface INotificationTemplateQuery {
  enabled?: boolean | undefined;
  channel?: NotificationChannel | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}
