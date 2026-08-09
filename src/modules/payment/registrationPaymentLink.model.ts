import { Schema, model } from 'mongoose';

const REGISTRATION_PAYMENT_LINK_STATUSES = [
  'active',
  'checkout_created',
  'paid',
  'revoked',
] as const;

const registrationPaymentLinkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: REGISTRATION_PAYMENT_LINK_STATUSES,
      default: 'active',
      index: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      trim: true,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const RegistrationPaymentLink = model(
  'RegistrationPaymentLink',
  registrationPaymentLinkSchema
);