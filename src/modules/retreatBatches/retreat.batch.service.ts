import { QueryFilter, Types } from "mongoose";

import { RetreatLocation } from "../retreatLocations/retreat.location.model.schema";
import {
  ICreateRetreatBatch,
  IRetreatBatch,
  IRetreatBatchQuery,
  IUpdateRetreatBatch,
} from "./retreat.batch.interface";
import { RetreatBatch } from "./retreat.batch.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

const BATCH_POPULATE = [
  {
    path: "retreatLocation",
    select: "title slug country city coverImage tagline promoVideoUrl whatsIncluded status",
  },
  {
    path: "createdBy",
    select: "fullName email role",
  },
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const createRetreatBatch = async (
  payload: ICreateRetreatBatch,
  actorId: string,
) => {
  assertValidObjectId(payload.retreatLocation, "Retreat location ID");

  const location = await RetreatLocation.findById(payload.retreatLocation);
  assertFound(location, "Parent retreat location not found", 404);

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throwServiceError("Invalid startDate or endDate format", 400);
  }

  if (endDate <= startDate) {
    throwServiceError("endDate must be strictly after startDate", 400);
  }

  const slug = payload.slug
    ? slugify(payload.slug)
    : slugify(`${location.slug}-${payload.batchName}`);

  const existing = await RetreatBatch.findOne({ slug });
  if (existing) {
    throwServiceError("A retreat batch with this slug already exists", 409);
  }

  const createData: Record<string, unknown> = {
    retreatLocation: location._id,
    batchName: payload.batchName,
    slug,
    startDate,
    endDate,
    capacity: payload.capacity,
    confirmedBookingsCount: 0,
    waitlistCount: 0,
    price: payload.price,
    currency: (payload.currency ?? "usd").toLowerCase(),
    status: payload.status ?? "upcoming",
    isFeatured: payload.isFeatured ?? false,
    isActive: payload.isActive ?? true,
    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.depositAmount !== undefined) {
    createData.depositAmount = payload.depositAmount;
  }

  if (payload.bookingDeadline !== undefined) {
    createData.bookingDeadline = new Date(payload.bookingDeadline);
  }

  if (payload.description !== undefined) {
    createData.description = payload.description;
  }

  if (payload.notes !== undefined) {
    createData.notes = payload.notes;
  }

  const batch = await RetreatBatch.create(createData);
  return batch.populate(BATCH_POPULATE);
};

const getAllRetreatBatches = async (
  query: IRetreatBatchQuery = {},
  isPublicOnly = false,
) => {
  const filter: QueryFilter<IRetreatBatch> = {};

  if (query.locationId) {
    assertValidObjectId(query.locationId, "Retreat location ID");
    filter.retreatLocation = new Types.ObjectId(query.locationId);
  }

  if (isPublicOnly) {
    filter.status = { $in: ["upcoming", "open", "sold_out"] };
    filter.isActive = true;
  } else {
    if (query.status) {
      filter.status = query.status;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
  }

  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured;
  }

  if (query.startDateFrom || query.startDateTo) {
    const timeFilter: Record<string, unknown> = {};
    if (query.startDateFrom) {
      timeFilter.$gte = new Date(query.startDateFrom);
    }
    if (query.startDateTo) {
      timeFilter.$lte = new Date(query.startDateTo);
    }
    filter.startDate = timeFilter as unknown as Date;
  }

  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ batchName: regex }, { description: regex }];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    RetreatBatch.find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate(BATCH_POPULATE),
    RetreatBatch.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: batches,
  };
};

const getSingleRetreatBatch = async (
  idOrSlug: string,
  isPublicOnly = false,
) => {
  const filter: Record<string, unknown> = {};

  if (Types.ObjectId.isValid(idOrSlug)) {
    filter._id = new Types.ObjectId(idOrSlug);
  } else {
    filter.slug = idOrSlug.toLowerCase();
  }

  if (isPublicOnly) {
    filter.isActive = true;
  }

  const batch = await RetreatBatch.findOne(filter).populate(BATCH_POPULATE);
  assertFound(batch, "Retreat batch not found", 404);

  return batch;
};

const updateRetreatBatch = async (
  batchId: string,
  payload: IUpdateRetreatBatch,
  actorId: string,
) => {
  assertValidObjectId(batchId, "Retreat batch ID");

  const batch = await RetreatBatch.findById(batchId);
  assertFound(batch, "Retreat batch not found", 404);

  if (payload.retreatLocation) {
    assertValidObjectId(payload.retreatLocation, "Retreat location ID");
    const location = await RetreatLocation.findById(payload.retreatLocation);
    assertFound(location, "Parent retreat location not found", 404);
    batch.retreatLocation = location._id as Types.ObjectId;
  }

  if (payload.batchName !== undefined) {
    batch.batchName = payload.batchName;
  }

  if (payload.slug !== undefined) {
    const slug = slugify(payload.slug);
    const existing = await RetreatBatch.findOne({
      slug,
      _id: { $ne: batch._id },
    });
    if (existing) {
      throwServiceError("A retreat batch with this slug already exists", 409);
    }
    batch.slug = slug;
  }

  if (payload.startDate !== undefined) {
    batch.startDate = new Date(payload.startDate);
  }

  if (payload.endDate !== undefined) {
    batch.endDate = new Date(payload.endDate);
  }

  if (batch.endDate <= batch.startDate) {
    throwServiceError("endDate must be strictly after startDate", 400);
  }

  if (payload.capacity !== undefined) {
    if (payload.capacity < batch.confirmedBookingsCount) {
      throwServiceError(
        `Capacity cannot be reduced below the current confirmed bookings count (${batch.confirmedBookingsCount})`,
        400,
      );
    }
    batch.capacity = payload.capacity;

    if (batch.confirmedBookingsCount >= batch.capacity && batch.status === "open") {
      batch.status = "sold_out";
    }
  }

  if (payload.price !== undefined) {
    batch.price = payload.price;
  }

  if (payload.depositAmount === null) {
    batch.set("depositAmount", undefined);
  } else if (payload.depositAmount !== undefined) {
    batch.depositAmount = payload.depositAmount;
  }

  if (payload.currency !== undefined) {
    batch.currency = payload.currency.toLowerCase();
  }

  if (payload.status !== undefined) {
    batch.status = payload.status;
  }

  if (payload.isFeatured !== undefined) {
    batch.isFeatured = payload.isFeatured;
  }

  if (payload.isActive !== undefined) {
    batch.isActive = payload.isActive;
  }

  if (payload.bookingDeadline === null) {
    batch.set("bookingDeadline", undefined);
  } else if (payload.bookingDeadline !== undefined) {
    batch.bookingDeadline = new Date(payload.bookingDeadline);
  }

  if (payload.description !== undefined) {
    batch.description = payload.description;
  }

  if (payload.notes !== undefined) {
    batch.notes = payload.notes;
  }

  batch.updatedBy = new Types.ObjectId(actorId);
  await batch.save();

  return batch.populate(BATCH_POPULATE);
};

const deleteRetreatBatch = async (batchId: string) => {
  assertValidObjectId(batchId, "Retreat batch ID");

  const batch = await RetreatBatch.findById(batchId);
  assertFound(batch, "Retreat batch not found", 404);

  if (batch.confirmedBookingsCount > 0) {
    throwServiceError(
      "Cannot delete a retreat batch with active confirmed bookings. Please cancel or refund bookings first.",
      400,
    );
  }

  await batch.deleteOne();
  return { success: true, message: "Retreat batch deleted successfully" };
};

export const retreatBatchService = {
  createRetreatBatch,
  getAllRetreatBatches,
  getSingleRetreatBatch,
  updateRetreatBatch,
  deleteRetreatBatch,
};
