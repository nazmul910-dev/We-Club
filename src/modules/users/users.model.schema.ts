import { Schema, model } from 'mongoose';

import { ACCOUNT_STATUSES, APPROVAL_STATUSES, IUser, SUBSCRIPTION_STATUSES, LICENSE_VERIFICATION_STATUSES, PAYMENT_STATUSES, USER_ROLES, ACCESS_TO_OPTIONS } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
    },
    accessTo: {
      type: String,
      required: true,
      enum: ACCESS_TO_OPTIONS,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },

    brokerage: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    profileImage: {
      type: String,
      trim: true
    },

    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },

    marketingChannels: [
      {
        type: String,
        trim: true,
      },
    ],

    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: 'pending',
    },

    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: 'pending_payment',
    },

    licenseVerificationStatus: {
      type: String,
      enum: LICENSE_VERIFICATION_STATUSES,
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
    },

    subscriptionStatus: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'none',
    },

    stripeCustomerId: {
      type: String,
      trim: true,
    },

    stripeSubscriptionId: {
      type: String,
      trim: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      trim: true,
    },

    subscriptionStartAt: {
      type: Date,
    },

    subscriptionExpiresAt: {
      type: Date,
    },


    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    approvedAt: {
      type: Date,
    },

    rejectedReason: {
      type: String,
      trim: true,
    },

    lifetimeCommissionEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvalEmailSentAt: {
      type: Date,
    },

    discretionScore: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);