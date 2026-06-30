import { Schema, model } from 'mongoose';
import {
  IPaymentSession,
  PAYMENT_PURPOSES,
  PAYMENT_SESSION_STATUSES,
} from './payment.interface';
import { USER_ROLES } from '../users/user.interface';

const PaymentSessionSchema = new Schema<IPaymentSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },

    purpose: {
      type: String,
      enum: PAYMENT_PURPOSES,
      required: true,
    },

    status: {
      type: String,
      enum: PAYMENT_SESSION_STATUSES,
      default: 'pending',
      index: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    stripeCustomerId: {
      type: String,
      trim: true,
    },

    stripeSubscriptionId: {
      type: String,
      trim: true,
    },

    checkoutUrl: {
      type: String,
      trim: true,
    },

    amountTotal: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentSession = model<IPaymentSession>(
  'PaymentSession',
  PaymentSessionSchema
);