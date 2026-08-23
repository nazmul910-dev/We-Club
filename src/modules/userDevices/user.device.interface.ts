import { Types } from "mongoose";

export const DEVICE_PLATFORMS = ["ios", "android", "web", "windows", "macos", "linux"] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export interface IPushSubscription {
  endpoint: string;
  p256dh?: string;
  auth?: string;
}

export interface IUserDevice {
  user: Types.ObjectId;
  deviceIdentifier: string;
  platform: DevicePlatform;
  deviceName?: string;
  appVersion?: string;
  pushSubscription?: IPushSubscription;
  isActive: boolean;
  lastActiveAt: Date;
  revokedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
