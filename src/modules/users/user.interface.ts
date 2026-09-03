import { Types } from 'mongoose';

export const USER_ROLES = [
    'founder',
    'super_admin',
    'co_mentor',
    'admin',
    'manager',
    'ceo',
    'ceo_partner',
    'associate',
    'partner',
    'ambassador', 
    'we_club_member'
] as const;

export const ACCESS_TO_OPTIONS = [
  'we_command_center',
  'invictus',
  'both',
] as const;


export const MEMBERSHIP_DURATIONS = [3, 6, 12] as const;

export type MembershipDurationMonths =
  (typeof MEMBERSHIP_DURATIONS)[number];

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


export const MEMBERSHIP_ACCESS_STATUSES = [
  'pending',
  'active',
  'expired',
] as const;

export type MembershipAccessStatus =
  (typeof MEMBERSHIP_ACCESS_STATUSES)[number];

export type AccessTo = (typeof ACCESS_TO_OPTIONS)[number];
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
    accessTo: AccessTo ;

    membershipDurationMonths?: MembershipDurationMonths;
    membershipAccessStatus: MembershipAccessStatus;
    
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

    // The member's selected co_mentor (a non-primary MentorshipProfile),
    // chosen at purchase/onboarding time. Paired with the platform's single
    // primary mentor on the accountability page.
    assignedCoMentorProfile?: Types.ObjectId | undefined;
    coMentorAssignedAt?: Date | undefined;
    coMentorAssignedBy?: Types.ObjectId | undefined;

    lifetimeCommissionEarned?: number | undefined;
    discretionScore?: number | undefined;

    approvalEmailSentAt?: Date | undefined;
    
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}