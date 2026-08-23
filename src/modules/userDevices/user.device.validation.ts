import { z } from "zod";

import { DEVICE_PLATFORMS } from "./user.device.interface";

const id = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const registerUserDeviceValidation = z.object({
  body: z.object({
    deviceIdentifier: z.string().trim().min(1).max(200),
    platform: z.enum(DEVICE_PLATFORMS),
    deviceName: z.string().trim().max(120).optional(),
    appVersion: z.string().trim().max(40).optional(),
    pushSubscription: z.object({
      endpoint: z.string().url().max(2000),
      p256dh: z.string().min(1).max(500).optional(),
      auth: z.string().min(1).max(500).optional(),
    }).optional(),
  }),
});

export const userDeviceIdValidation = z.object({ params: z.object({ id }) });
