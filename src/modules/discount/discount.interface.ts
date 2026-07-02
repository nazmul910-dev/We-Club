import { Types } from 'mongoose';
import { AccessTo, UserRole } from '../users/user.interface';

export interface IDiscountCode {
  code: string;
  discountPercent: number;

  isActive: boolean;

  allowedRoles?: UserRole[];
  allowedAccessTo?: AccessTo[];

  maxRedemptionsPerRole: number;

  expiresAt?: Date;

  createdBy?: Types.ObjectId;
  note?: string;

  usedCount?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDiscountRedemption {
  discountCode: Types.ObjectId;
  code: string;

  user: Types.ObjectId;
  role: UserRole;
  accessTo: AccessTo;

  stripeCheckoutSessionId: string;

  redeemedAt: Date;
}