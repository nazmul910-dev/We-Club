import { Schema, model } from 'mongoose';
import {
  IDiscountCode,
  IDiscountRedemption,
} from './discount.interface';
import {
  ACCESS_TO_OPTIONS,
  USER_ROLES,
} from '../users/user.interface';

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    allowedRoles: [
      {
        type: String,
        enum: USER_ROLES,
      },
    ],

    allowedAccessTo: [
      {
        type: String,
        enum: ACCESS_TO_OPTIONS,
      },
    ],

     maxRedemptions: {
      type: Number,
      default: 1,
      min: 1,
    },

    expiresAt: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    note: {
      type: String,
      trim: true,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const DiscountRedemptionSchema = new Schema<IDiscountRedemption>(
  {
    discountCode: {
      type: Schema.Types.ObjectId,
      ref: 'DiscountCode',
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      // required: true,
      index: true,
    },

    accessTo: {
      type: String,
      enum: ACCESS_TO_OPTIONS,
      // required: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      required: true,
      index: true,
    },

    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

DiscountRedemptionSchema.index(
  {
    discountCode: 1,
  },
  {
    unique: true,
  }
);

export const DiscountCode = model<IDiscountCode>(
  'DiscountCode',
  DiscountCodeSchema
);

export const DiscountRedemption = model<IDiscountRedemption>(
  'DiscountRedemption',
  DiscountRedemptionSchema
);