<<<<<<< HEAD
import mongoose from "mongoose";
import { IUser } from "./user.interface";
import { ObjectId } from "mongodb";

const userSchema  = new mongoose.Schema<IUser>({
    name: {
        type: String , 
      }, 
    email: {
        type: String,
        unique: true, 
      },
    password: {
        type: String, 
      },
    role: {
        type: String,
        enum: ['ADMIN', 'ASSOCIATES', 'PARTNERS', 'USER'],
        default: 'USER'
=======
import {Schema, model} from 'mongoose';

import { ACCOUNT_STATUSES, APPROVAL_STATUSES, IUser, LICENSE_VERIFICATION_STATUSES, PAYMENT_STATUSES, USER_ROLES } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true, 
      maxlength: 100,
>>>>>>> 07a2587ea5b995a08e68549905609cc1381f038b
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
    },

    socialLinks: {
      linkedin: {
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

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
    },

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