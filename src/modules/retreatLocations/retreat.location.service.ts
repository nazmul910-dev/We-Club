import { QueryFilter, Types } from "mongoose";

import {
  ICreateRetreatLocation,
  IRetreatLocation,
  IRetreatLocationQuery,
  IUpdateRetreatLocation,
} from "./retreat.location.interface";
import { RetreatLocation } from "./retreat.location.model.schema";

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

const LOCATION_POPULATE = [
  {
    path: "createdBy",
    select: "fullName email role",
  },
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const createRetreatLocation = async (
  payload: ICreateRetreatLocation,
  actorId: string,
) => {
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);

  const existing = await RetreatLocation.findOne({ slug });
  if (existing) {
    throwServiceError("A retreat location with this slug already exists", 409);
  }

  const createData: Record<string, unknown> = {
    title: payload.title,
    slug,
    country: payload.country,
    city: payload.city,
    description: payload.description,
    galleryImages: payload.galleryImages ?? [],
    whatsIncluded: payload.whatsIncluded ?? [],
    isFeatured: payload.isFeatured ?? false,
    isActive: payload.isActive ?? true,
    status: payload.status ?? "published",
    order: payload.order ?? 0,
    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.tagline !== undefined) {
    createData.tagline = payload.tagline;
  }

  if (payload.coverImage !== undefined) {
    createData.coverImage = payload.coverImage;
  }

  if (payload.promoVideoUrl !== undefined) {
    createData.promoVideoUrl = payload.promoVideoUrl;
  }

  const location = await RetreatLocation.create(createData);
  return location.populate(LOCATION_POPULATE);
};

const getAllRetreatLocations = async (
  query: IRetreatLocationQuery = {},
  isPublicOnly = false,
) => {
  const filter: QueryFilter<IRetreatLocation> = {};

  if (isPublicOnly) {
    filter.status = "published";
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

  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ title: regex }, { city: regex }, { country: regex }];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [locations, total] = await Promise.all([
    RetreatLocation.find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(LOCATION_POPULATE)
      .lean(),
    RetreatLocation.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: locations,
  };
};

const getSingleRetreatLocation = async (
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
    filter.status = "published";
    filter.isActive = true;
  }

  const location = await RetreatLocation.findOne(filter).populate(
    LOCATION_POPULATE,
  ).lean();

  assertFound(location, "Retreat location not found", 404);
  return location;
};

const updateRetreatLocation = async (
  locationId: string,
  payload: IUpdateRetreatLocation,
  actorId: string,
) => {
  assertValidObjectId(locationId, "Retreat location ID");

  const location = await RetreatLocation.findById(locationId);
  assertFound(location, "Retreat location not found", 404);

  if (payload.title !== undefined) {
    location.title = payload.title;
  }

  if (payload.slug !== undefined) {
    const slug = slugify(payload.slug);
    const existing = await RetreatLocation.findOne({
      slug,
      _id: { $ne: location._id },
    });
    if (existing) {
      throwServiceError("A retreat location with this slug already exists", 409);
    }
    location.slug = slug;
  }

  if (payload.country !== undefined) {
    location.country = payload.country;
  }

  if (payload.city !== undefined) {
    location.city = payload.city;
  }

  if (payload.tagline !== undefined) {
    location.tagline = payload.tagline;
  }

  if (payload.description !== undefined) {
    location.description = payload.description;
  }

  if (payload.coverImage === null) {
    location.set("coverImage", undefined);
  } else if (payload.coverImage !== undefined) {
    location.coverImage = payload.coverImage;
  }

  if (payload.promoVideoUrl === null) {
    location.set("promoVideoUrl", undefined);
  } else if (payload.promoVideoUrl !== undefined) {
    location.promoVideoUrl = payload.promoVideoUrl;
  }

  if (payload.galleryImages !== undefined) {
    location.galleryImages = payload.galleryImages;
  }

  if (payload.whatsIncluded !== undefined) {
    location.whatsIncluded = payload.whatsIncluded;
  }

  if (payload.isFeatured !== undefined) {
    location.isFeatured = payload.isFeatured;
  }

  if (payload.isActive !== undefined) {
    location.isActive = payload.isActive;
  }

  if (payload.status !== undefined) {
    location.status = payload.status;
  }

  if (payload.order !== undefined) {
    location.order = payload.order;
  }

  location.updatedBy = new Types.ObjectId(actorId);
  await location.save();

  return location.populate(LOCATION_POPULATE);
};

const deleteRetreatLocation = async (locationId: string) => {
  assertValidObjectId(locationId, "Retreat location ID");

  const location = await RetreatLocation.findById(locationId);
  assertFound(location, "Retreat location not found", 404);

  await location.deleteOne();
  return { success: true, message: "Retreat location deleted successfully" };
};

export const retreatLocationService = {
  createRetreatLocation,
  getAllRetreatLocations,
  getSingleRetreatLocation,
  updateRetreatLocation,
  deleteRetreatLocation,
};
