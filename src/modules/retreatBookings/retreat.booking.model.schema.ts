import { model, Schema } from "mongoose";

import {
  IEmergencyContact,
  IRetreatBooking,
  RETREAT_BOOKING_STATUSES,
} from "./retreat.booking.interface";

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 50 },
    relationship: { type: String, trim: true, maxlength: 50 },
  },
  { _id: false },
);

const retreatBookingSchema = new Schema<IRetreatBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    retreatBatch: {
      type: Schema.Types.ObjectId,
      ref: "RetreatBatch",
      required: true,
      index: true,
    },

    retreatLocation: {
      type: Schema.Types.ObjectId,
      ref: "RetreatLocation",
      required: true,
      index: true,
    },

    paymentSession: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSession",
    },

    status: {
      type: String,
      enum: RETREAT_BOOKING_STATUSES,
      default: "waitlisted",
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },

    stripeCheckoutSessionId: {
      type: String,
      trim: true,
      index: true,
    },

    stripePaymentIntentId: {
      type: String,
      trim: true,
    },

    checkoutUrl: {
      type: String,
      trim: true,
    },

    invitationExpiresAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },

    confirmedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    refundedAt: {
      type: Date,
    },

    refundAmount: {
      type: Number,
      min: 0,
    },

    refundReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    specialRequests: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    dietaryRequirements: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    emergencyContact: {
      type: emergencyContactSchema,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "retreatbookings",
  },
);

retreatBookingSchema.index({
  user: 1,
  retreatBatch: 1,
});

retreatBookingSchema.index({
  retreatBatch: 1,
  status: 1,
});

retreatBookingSchema.index({
  user: 1,
  status: 1,
});

export const RetreatBooking = model<IRetreatBooking>(
  "RetreatBooking",
  retreatBookingSchema,
);
