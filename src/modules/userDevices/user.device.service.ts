import { Types } from "mongoose";

import assertFound from "../../utility/assertFound";

import { IUserDevice } from "./user.device.interface";
import { UserDevice } from "./user.device.model.schema";

const safeSelect = "_id deviceIdentifier platform deviceName appVersion isActive lastActiveAt revokedAt createdAt updatedAt";

export const userDeviceService = {
  async register(userId: string, payload: Omit<IUserDevice, "user" | "isActive" | "lastActiveAt">) {
    const device = await UserDevice.findOneAndUpdate(
      { user: new Types.ObjectId(userId), deviceIdentifier: payload.deviceIdentifier },
      { ...payload, user: new Types.ObjectId(userId), isActive: true, revokedAt: undefined, lastActiveAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    ).select(safeSelect);
    return device;
  },
  list(userId: string) { return UserDevice.find({ user: userId }).select(safeSelect).sort({ lastActiveAt: -1 }); },
  async revoke(userId: string, id: string) {
    const device = await UserDevice.findOneAndUpdate(
      { _id: id, user: userId },
      { isActive: false, revokedAt: new Date() },
      { new: true },
    ).select(safeSelect);
    assertFound(device, "Device not found", 404);
    return device;
  },
};
