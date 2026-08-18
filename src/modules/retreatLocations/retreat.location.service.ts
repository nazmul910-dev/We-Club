import { QueryFilter, Types } from "mongoose";

import {
  ICreateRetreatLocation,
  IRetreatLocation,
  IRetreatLocationQuery,
  IUpdateRetreatLocation,
} from "./retreat.location.interface";

import { RetreatLocation } from "./retreat.location.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

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

const isAdminOrManager = (role?: string | undefined): boolean => {
  return (
    role === "admin" ||
    role === "manager" ||
    role === "founder" ||
    role === "super_admin"
  );
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (
  name: string,
  excludeId?: Types.ObjectId | string,
): Promise<string> => {
  const baseSlug = slugify(name) || "retreat-location";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await RetreatLocation.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const LOCATION_POPULATE = [
  {
    path: "createdBy",
    select: "fullName email role profileImage",
  },
  {
    path: "updatedBy",
    select: "fullName email role profileImage",
  },
];

const createRetreatLocation = async (
  payload: ICreateRetreatLocation,
  actorId: string,
) => {
  assertValidObjectId(actorId, "Actor ID");

  const slug = payload.slug
    ? slugify(payload.slug)
    : await generateUniqueSlug(payload.name);

  const existingWithSlug = await RetreatLocation.findOne({ slug });
  if (existingWithSlug) {
    throwServiceError(`Retreat location with slug '${slug}' already exists`, 409);
  }

  const createData: Record<string, unknown> = {
    name: payload.name.trim(),
    slug,
    country: payload.country.trim(),
    city: payload.city.trim(),
    description: payload.description.trim(),
    coverImage: payload.coverImage.trim(),
    gallery: payload.gallery ?? [],
    amenities: payload.amenities ?? [],
    featured: payload.featured ?? false,
    isActive: payload.isActive ?? true,
    order: payload.order ?? 0,
    status: "draft",
    createdBy: new Types.ObjectId(actorId),
  };

  if (payload.stateOrProvince) {
    createData.stateOrProvince = payload.stateOrProvince.trim();
  }

  if (payload.address) {
    createData.address = payload.address.trim();
  }

  if (payload.shortDescription) {
    createData.shortDescription = payload.shortDescription.trim();
  }

  if (payload.coordinates) {
    createData.coordinates = payload.coordinates;
  }

  if (payload.venueDetails) {
    createData.venueDetails = payload.venueDetails;
  }

  try {
    const location = await RetreatLocation.create(createData);
    return location.populate(LOCATION_POPULATE);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError("A retreat location with this slug already exists", 409);
    }
    throw error;
  }
};

const getAllRetreatLocations = async (
  query: IRetreatLocationQuery,
  actorRole?: string,
) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: QueryFilter<IRetreatLocation> = {};

  if (!isAdminOrManager(actorRole)) {
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

  if (query.country) {
    filter.country = { $regex: new RegExp(`^${query.country.trim()}$`, "i") };
  }

  if (query.city) {
    filter.city = { $regex: new RegExp(`^${query.city.trim()}$`, "i") };
  }

  if (query.featured !== undefined) {
    filter.featured = query.featured;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { country: searchRegex },
      { city: searchRegex },
      { description: searchRegex },
    ];
  }

  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sortOption: Record<string, 1 | -1> = query.sortBy
    ? { [query.sortBy]: sortOrder }
    : { featured: -1, order: 1, createdAt: -1 };

  const [data, total] = await Promise.all([
    RetreatLocation.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(LOCATION_POPULATE),
    RetreatLocation.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getFeaturedRetreatLocations = async () => {
  return RetreatLocation.find({
    featured: true,
    status: "published",
    isActive: true,
  })
    .sort({ order: 1, createdAt: -1 })
    .populate(LOCATION_POPULATE);
};

const getSingleRetreatLocationById = async (
  id: string,
  actorRole?: string,
) => {
  assertValidObjectId(id, "Retreat location ID");

  const filter: Record<string, unknown> = { _id: id };

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  }

  const location = await RetreatLocation.findOne(filter).populate(
    LOCATION_POPULATE,
  );

  assertFound(location, "Retreat location not found", 404);

  return location;
};

const getSingleRetreatLocationBySlug = async (
  slug: string,
  actorRole?: string,
) => {
  const filter: Record<string, unknown> = { slug: slug.toLowerCase().trim() };

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
    filter.isActive = true;
  }

  const location = await RetreatLocation.findOne(filter).populate(
    LOCATION_POPULATE,
  );

  assertFound(location, "Retreat location not found", 404);

  return location;
};

const updateRetreatLocation = async (
  id: string,
  payload: IUpdateRetreatLocation,
  actorId: string,
) => {
  assertValidObjectId(id, "Retreat location ID");
  assertValidObjectId(actorId, "Actor ID");

  const location = await RetreatLocation.findById(id);
  assertFound(location, "Retreat location not found", 404);

  if (payload.name !== undefined) {
    location.name = payload.name.trim();
  }

  if (payload.slug !== undefined) {
    const customSlug = slugify(payload.slug);
    const existingWithSlug = await RetreatLocation.findOne({
      slug: customSlug,
      _id: { $ne: new Types.ObjectId(id) },
    });

    if (existingWithSlug) {
      throwServiceError(
        `Retreat location with slug '${customSlug}' already exists`,
        409,
      );
    }

    location.slug = customSlug;
  } else if (payload.name !== undefined && payload.name !== location.name) {
    location.slug = await generateUniqueSlug(payload.name, id);
  }

  if (payload.country !== undefined) {
    location.country = payload.country.trim();
  }

  if (payload.city !== undefined) {
    location.city = payload.city.trim();
  }

  if (payload.stateOrProvince !== undefined) {
    location.stateOrProvince = payload.stateOrProvince
      ? payload.stateOrProvince.trim()
      : undefined;
  }

  if (payload.address !== undefined) {
    location.address = payload.address ? payload.address.trim() : undefined;
  }

  if (payload.description !== undefined) {
    location.description = payload.description.trim();
  }

  if (payload.shortDescription !== undefined) {
    location.shortDescription = payload.shortDescription
      ? payload.shortDescription.trim()
      : undefined;
  }

  if (payload.coverImage !== undefined) {
    location.coverImage = payload.coverImage.trim();
  }

  if (payload.gallery !== undefined) {
    location.gallery = payload.gallery;
  }

  if (payload.amenities !== undefined) {
    location.amenities = payload.amenities;
  }

  if (payload.coordinates !== undefined) {
    location.coordinates = payload.coordinates || undefined;
  }

  if (payload.venueDetails !== undefined) {
    location.venueDetails = payload.venueDetails || undefined;
  }

  if (payload.featured !== undefined) {
    location.featured = payload.featured;
  }

  if (payload.isActive !== undefined) {
    location.isActive = payload.isActive;
  }

  if (payload.order !== undefined) {
    location.order = payload.order;
  }

  location.updatedBy = new Types.ObjectId(actorId);

  await location.save();

  return location.populate(LOCATION_POPULATE);
};

const publishRetreatLocation = async (id: string, actorId: string) => {
  assertValidObjectId(id, "Retreat location ID");
  assertValidObjectId(actorId, "Actor ID");

  const location = await RetreatLocation.findById(id);
  assertFound(location, "Retreat location not found", 404);

  if (location.status === "archived") {
    throwServiceError("Archived retreat location cannot be directly published", 400);
  }

  location.status = "published";
  location.isActive = true;
  location.publishedAt = new Date();
  location.set("archivedAt", undefined);
  location.updatedBy = new Types.ObjectId(actorId);

  await location.save();

  return location.populate(LOCATION_POPULATE);
};

const moveRetreatLocationToDraft = async (id: string, actorId: string) => {
  assertValidObjectId(id, "Retreat location ID");
  assertValidObjectId(actorId, "Actor ID");

  const location = await RetreatLocation.findById(id);
  assertFound(location, "Retreat location not found", 404);

  if (location.status === "archived") {
    throwServiceError("Archived retreat location cannot be moved to draft", 400);
  }

  location.status = "draft";
  location.set("publishedAt", undefined);
  location.updatedBy = new Types.ObjectId(actorId);

  await location.save();

  return location.populate(LOCATION_POPULATE);
};

const archiveRetreatLocation = async (id: string, actorId: string) => {
  assertValidObjectId(id, "Retreat location ID");
  assertValidObjectId(actorId, "Actor ID");

  const location = await RetreatLocation.findById(id);
  assertFound(location, "Retreat location not found", 404);

  location.status = "archived";
  location.isActive = false;
  location.archivedAt = new Date();
  location.set("publishedAt", undefined);
  location.updatedBy = new Types.ObjectId(actorId);

  await location.save();

  return location.populate(LOCATION_POPULATE);
};

const deleteRetreatLocation = async (id: string) => {
  assertValidObjectId(id, "Retreat location ID");

  const location = await RetreatLocation.findByIdAndDelete(id);
  assertFound(location, "Retreat location not found", 404);

  return { id, deleted: true };
};

export const retreatLocationService = {
  createRetreatLocation,
  getAllRetreatLocations,
  getFeaturedRetreatLocations,
  getSingleRetreatLocationById,
  getSingleRetreatLocationBySlug,
  updateRetreatLocation,
  publishRetreatLocation,
  moveRetreatLocationToDraft,
  archiveRetreatLocation,
  deleteRetreatLocation,
};
