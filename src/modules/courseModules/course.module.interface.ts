import { Types } from 'mongoose';

export const COURSE_MODULE_STATUSES = [
  'draft',
  'published',
  'archived',
] as const;

export type CourseModuleStatus =
  (typeof COURSE_MODULE_STATUSES)[number];

export interface ICourseModule {
  pillar: Types.ObjectId;

  title: string;
  slug: string;

  shortDescription?: string | undefined;
  description: string;

  thumbnailUrl?: string | undefined;

  moduleNumber: number;

  estimatedDurationMinutes: number;

  minimumVideoPercent: number;
  minimumActionPercent: number;
  minimumQuizScore: number;

  maximumQuizAttempts: number;

  completionPoints: number;

  status: CourseModuleStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateCourseModule {
  pillar: string;

  title: string;
  slug: string;

  shortDescription?: string;
  description: string;

  thumbnailUrl?: string;

  moduleNumber: number;

  estimatedDurationMinutes?: number;

  minimumVideoPercent?: number;
  minimumActionPercent?: number;
  minimumQuizScore?: number;

  maximumQuizAttempts?: number;

  completionPoints?: number;
}

export interface IUpdateCourseModule {
  title?: string;
  slug?: string;

  shortDescription?: string | null;
  description?: string;

  thumbnailUrl?: string | null;

  moduleNumber?: number;

  estimatedDurationMinutes?: number;

  minimumVideoPercent?: number;
  minimumActionPercent?: number;
  minimumQuizScore?: number;

  maximumQuizAttempts?: number;

  completionPoints?: number;
}