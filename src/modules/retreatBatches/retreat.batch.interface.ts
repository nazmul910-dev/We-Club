import { Types } from "mongoose";

export const RETREAT_BATCH_STATUSES = [
  "upcoming",
  "open",
  "sold_out",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type RetreatBatchStatus = (typeof RETREAT_BATCH_STATUSES)[number];

export interface IRetreatBatch {
  retreatLocation: Types.ObjectId;

  batchName: string;
  slug: string;

  startDate: Date;
  endDate: Date;

  capacity: number;
  confirmedBookingsCount: number;
  waitlistCount: number;

  price: number;
  depositAmount?: number | undefined;
  currency: string;

  status: RetreatBatchStatus;
  isFeatured: boolean;
  isActive: boolean;

  bookingDeadline?: Date | undefined;
  description?: string | undefined;
  notes?: string | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateRetreatBatch {
  retreatLocation: string;
  batchName: string;
  slug?: string | undefined;

  startDate: string | Date;
  endDate: string | Date;

  capacity: number;
  price: number;
  depositAmount?: number | undefined;
  currency?: string | undefined;

  status?: RetreatBatchStatus | undefined;
  isFeatured?: boolean | undefined;
  isActive?: boolean | undefined;

  bookingDeadline?: string | Date | undefined;
  description?: string | undefined;
  notes?: string | undefined;
}

export interface IUpdateRetreatBatch {
  retreatLocation?: string | undefined;
  batchName?: string | undefined;
  slug?: string | undefined;

  startDate?: string | Date | undefined;
  endDate?: string | Date | undefined;

  capacity?: number | undefined;
  price?: number | undefined;
  depositAmount?: number | null | undefined;
  currency?: string | undefined;

  status?: RetreatBatchStatus | undefined;
  isFeatured?: boolean | undefined;
  isActive?: boolean | undefined;

  bookingDeadline?: string | Date | null | undefined;
  description?: string | undefined;
  notes?: string | undefined;
}

export interface IRetreatBatchQuery {
  locationId?: string | undefined;
  includePast?: boolean | undefined;
  status?: RetreatBatchStatus | undefined;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
  startDateFrom?: string | undefined;
  startDateTo?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  locationIds? : string
}