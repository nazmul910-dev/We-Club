import { model, Schema } from "mongoose";

import {
  ACTIVITY_LOG_ACTIONS,
  ACTIVITY_LOG_ENTITY_TYPES,
  IActivityLog,
} from "./activitylog.interface";

/**
 * এই key গুলো ভুলেও changes object-এ save হবে না —
 * "Do not store passwords, tokens or secrets" rule অনুযায়ী।
 */
const SENSITIVE_KEYS = [
  "password",
  "newPassword",
  "oldPassword",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "otp",
  "secret",
  "apiKey",
];

const stripSensitiveKeys = (
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined => {
  if (!value) {
    return value;
  }

  const cleaned: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(value)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase()),
    );

    if (!isSensitive) {
      cleaned[key] = val;
    }
  }

  return cleaned;
};

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ACTIVITY_LOG_ACTIONS,
      required: true,
      index: true,
    },

    targetEntityType: {
      type: String,
      enum: ACTIVITY_LOG_ENTITY_TYPES,
      required: true,
      index: true,
    },

    targetEntityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    changeSummary: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    changes: {
      type: Schema.Types.Mixed,
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "activitylog",
  },
);

/**
 * Append-only audit history — কোনো update/delete method
 * ইচ্ছাকৃতভাবে এখানে নেই।
 */
activityLogSchema.pre("save", function () {
  if (this.isModified("changes")) {
    this.changes = stripSensitiveKeys(
      this.changes as Record<string, unknown> | undefined,
    );
  }
});

activityLogSchema.index({
  actor: 1,
  createdAt: -1,
});

activityLogSchema.index({
  targetEntityType: 1,
  targetEntityId: 1,
  createdAt: -1,
});

activityLogSchema.index({
  action: 1,
  createdAt: -1,
});

export const ActivityLog = model<IActivityLog>(
  "ActivityLog",
  activityLogSchema,
);