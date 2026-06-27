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

interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Roles;
    createdAt: Date;

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