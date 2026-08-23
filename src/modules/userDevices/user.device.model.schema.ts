import { model, Schema } from "mongoose";

import { DEVICE_PLATFORMS, IUserDevice } from "./user.device.interface";

const pushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, trim: true, maxlength: 2000 },
    p256dh: { type: String, select: false },
    auth: { type: String, select: false },
  },
  { _id: false },
);

const userDeviceSchema = new Schema<IUserDevice>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceIdentifier: { type: String, required: true, trim: true, maxlength: 200, index: true },
    platform: { type: String, enum: DEVICE_PLATFORMS, required: true },
    deviceName: { type: String, trim: true, maxlength: 120 },
    appVersion: { type: String, trim: true, maxlength: 40 },
    pushSubscription: { type: pushSubscriptionSchema },
    isActive: { type: Boolean, default: true, required: true, index: true },
    lastActiveAt: { type: Date, default: Date.now, required: true },
    revokedAt: Date,
  },
  { timestamps: true, collection: "userdevices" },
);

userDeviceSchema.index({ user: 1, deviceIdentifier: 1 }, { unique: true });
userDeviceSchema.index(
  { "pushSubscription.endpoint": 1 },
  { unique: true, sparse: true, partialFilterExpression: { isActive: true } },
);

export const UserDevice = model<IUserDevice>("UserDevice", userDeviceSchema);
