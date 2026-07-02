import { Types } from 'mongoose';
import { UserRole,AccessTo } from '../users/user.interface';

export const PAYMENT_PURPOSES = ['registration', 'upgrade'] as const;

export const PAYMENT_SESSION_STATUSES = [
  'pending',
  'paid',
  'failed',
  'expired',
] as const;

export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export type PaymentSessionStatus =
  (typeof PAYMENT_SESSION_STATUSES)[number];

export interface IPaymentSession {
  user: Types.ObjectId; 

  role: UserRole;
  accessTo: AccessTo;


  purpose: PaymentPurpose;
  status: PaymentSessionStatus;

  stripeCheckoutSessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  checkoutUrl?: string;

  amountTotal?: number;
  originalAmountTotal?: number;
  discountAmountTotal?: number;
  discountCode?: string;
  discountPercent?: number;
  currency?: string;

  createdAt?: Date;
  updatedAt?: Date;
}