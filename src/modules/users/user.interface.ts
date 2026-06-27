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


export type UserRole = (typeof USER_ROLES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type LicenseVerificationStatus = (typeof LICENSE_VERIFICATION_STATUSES)[number];


export interface IUserSocialLinks {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
}

export interface IUser {
    fullName: string;
    email: string;
    password: string;

    role: UserRole;

    licenseNumber?: string;
    brokerage?: string;
    phone?: string;
    city?: string;
    country?: string;
    bio?: string;
    profileImage?: string;

    socialLinks?: IUserSocialLinks;
    marketingChannels?: string[];

    paymentStatus: PaymentStatus;
    approvalStatus: ApprovalStatus;
    accountStatus: AccountStatus;
    licenseVerificationStatus: LicenseVerificationStatus;

    subscriptionStartAt?: Date; 
    subscriptionExpiresAt?: Date;

    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedReason?: string;

    lifetimeCommissionEarned?: number;
    discretionScore?: number;

    createdAt?: Date;
    updatedAt?: Date;
}