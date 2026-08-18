import { Types } from "mongoose";

export const RETREAT_BOOKING_STATUSES = [
  "waitlisted",
  "invited",
  "payment_pending",
  "confirmed",
  "cancelled",
  "refunded",
] as const;

export type RetreatBookingStatus = (typeof RETREAT_BOOKING_STATUSES)[number];

export interface IEmergencyContact {
  name?: string | undefined;
  phone?: string | undefined;
  relationship?: string | undefined;
}

export interface IRetreatBooking {
  user: Types.ObjectId;
  retreatBatch: Types.ObjectId;
  retreatLocation: Types.ObjectId;
  paymentSession?: Types.ObjectId | undefined;

  status: RetreatBookingStatus;

  amount: number;
  amountPaid?: number | undefined;
  currency: string;

  stripeCheckoutSessionId?: string | undefined;
  stripePaymentIntentId?: string | undefined;
  checkoutUrl?: string | undefined;

  invitationExpiresAt?: Date | undefined;
  paidAt?: Date | undefined;
  confirmedAt?: Date | undefined;
  cancelledAt?: Date | undefined;
  cancellationReason?: string | undefined;
  refundedAt?: Date | undefined;
  refundAmount?: number | undefined;
  refundReason?: string | undefined;

  notes?: string | undefined;
  specialRequests?: string | undefined;
  dietaryRequirements?: string | undefined;
  emergencyContact?: IEmergencyContact | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateRetreatBooking {
  retreatBatch: string;
  notes?: string | undefined;
  specialRequests?: string | undefined;
  dietaryRequirements?: string | undefined;
  emergencyContact?: IEmergencyContact | undefined;
}

export interface IUpdateRetreatBooking {
  notes?: string | undefined;
  specialRequests?: string | undefined;
  dietaryRequirements?: string | undefined;
  emergencyContact?: IEmergencyContact | undefined;
}

export interface IInviteRetreatBooking {
  invitationExpiresInHours?: number | undefined;
  notes?: string | undefined;
}

export interface ICancelRetreatBooking {
  reason: string;
}

export interface IRefundRetreatBooking {
  refundAmount?: number | undefined;
  reason?: string | undefined;
}

export interface IConfirmRetreatBookingAdmin {
  amountPaid?: number | undefined;
  notes?: string | undefined;
}

export interface IRetreatBookingQuery {
  userId?: string | undefined;
  batchId?: string | undefined;
  locationId?: string | undefined;
  status?: RetreatBookingStatus | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}
