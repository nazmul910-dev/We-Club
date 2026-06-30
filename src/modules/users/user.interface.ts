import { Types } from 'mongoose';

export const USER_ROLES = [
    'admin',
    'manager',
    'ceo',
    'ceo_partner',
    'associate',
    'partner',
    'ambassador',
    'we_club_member'
] as const;


export const PAYMENT_STATUSES = [
    'unpaid',
    'paid',
    'failed',
    'refunded',
    'expired',
] as const;


export const APPROVAL_STATUSES = [
    'pending',
    'approved',
    'rejected',
] as const;

export const ACCOUNT_STATUSES = [
    'active',
    'pending_payment',
    'pending_approval',
    'suspended',
    'rejected',
] as const;


export const LICENSE_VERIFICATION_STATUSES = [
    'pending',
    'verified',
    'rejected',
] as const;

export const SUBSCRIPTION_STATUSES = [
    'none',
    'incomplete',
    'active',
    'past_due',
    'canceled',
    'expired',
] as const;


export type UserRole = (typeof USER_ROLES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type LicenseVerificationStatus = (typeof LICENSE_VERIFICATION_STATUSES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface IUserSocialLinks {
    linkedin?: string | undefined;
    facebook?: string | undefined;
    twitter?: string | undefined;
    instagram?: string | undefined;
    website?: string | undefined;
}

export interface IUser {
    fullName: string;
    email: string;
    password: string;

    role: UserRole;

    licenseNumber?: string | undefined;
    brokerage?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    bio?: string | undefined;
    profileImage?: string | undefined;

    socialLinks?: IUserSocialLinks | undefined;
    marketingChannels?: string[] | undefined;

    paymentStatus: PaymentStatus;
    approvalStatus: ApprovalStatus;
    accountStatus: AccountStatus;
    licenseVerificationStatus: LicenseVerificationStatus;

    stripeCustomerId?: string | undefined;
    stripeSubscriptionId?: string | undefined;
    stripeCheckoutSessionId?: string | undefined;

    subscriptionStatus?: SubscriptionStatus | undefined;
    subscriptionStartAt?: Date | undefined;
    subscriptionExpiresAt?: Date | undefined;

    approvedBy?: Types.ObjectId | undefined;
    approvedAt?: Date | undefined;
    rejectedReason?: string | undefined;

    lifetimeCommissionEarned?: number | undefined;
    discretionScore?: number | undefined;

    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}