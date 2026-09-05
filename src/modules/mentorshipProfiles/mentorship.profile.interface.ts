import { Types } from "mongoose";

export const MENTORSHIP_PROFILE_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type MentorshipProfileStatus =
  (typeof MENTORSHIP_PROFILE_STATUSES)[number];

export const AVAILABILITY_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number];

export interface IMentorshipAvailabilitySlot {
  day: AvailabilityDay;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface IMentorshipProfile {
  mentor: Types.ObjectId;

  bio: string;
  expertise: string[];

  availability: IMentorshipAvailabilitySlot[];

  profileImage?: string | undefined;

  isPrimaryMentor: boolean;
  isActive: boolean;

  yearsOfExperience?: number | undefined;

  sessionDurationMinutes: number;

  status: MentorshipProfileStatus;

  order: number;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateMentorshipProfile {
  mentor: string;

  bio: string;
  expertise?: string[];

  availability?: IMentorshipAvailabilitySlot[];

  profileImage?: string;

  isPrimaryMentor?: boolean;

  yearsOfExperience?: number;

  sessionDurationMinutes?: number;

  order?: number;
}

export interface IUpdateMentorshipProfile {
  bio?: string;
  expertise?: string[];

  availability?: IMentorshipAvailabilitySlot[];

  profileImage?: string | null;

  isPrimaryMentor?: boolean;
  isActive?: boolean;

  yearsOfExperience?: number;

  sessionDurationMinutes?: number;

  order?: number;
}

export interface IMentorshipProfileAdminQuery {
  status?: MentorshipProfileStatus | undefined;
  isActive?: boolean | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}

interface ICreateMentorProfileFields {
  bio: string;
  expertise?: string[];
  availability?: IMentorshipAvailabilitySlot[];
  profileImage?: string;
  yearsOfExperience?: number;
  sessionDurationMinutes?: number;
  order?: number;
  isPrimaryMentor?: boolean;
}

export type ICreateMentorInput = ICreateMentorProfileFields &
  (
    | {
        mode: "create";
        fullName: string;
        email: string;
        password: string;
      }
    | {
        mode: "existing";
        userId: string;
      }
  );