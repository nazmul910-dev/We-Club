import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import {
  ICreateModuleResource,
  IModuleResource,
  IUpdateModuleResource,
} from "./module.resource.interface";
import { ModuleResource } from "./module.resource.model.schema";

const throwServiceError = (
  message: string,
  statusCode: number
): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;
  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number
) => asserts value is T = (value, message, statusCode) => {
  if (value === null || value === undefined) {
    throwServiceError(message, statusCode);
  }
};

const isAdminOrManager = (role?: string | undefined): boolean => {
  return role === "admin" || role === "manager";
};

const setNullableField = (
  document: { set: (path: string, value: unknown) => unknown },
  path: string,
  value: unknown
): void => {
  if (value === null) {
    document.set(path, undefined);
    return;
  }

  if (value !== undefined) {
    document.set(path, value);
  }
};

const ensureCourseModuleExists = async (moduleId: string) => {
  const courseModule = await CourseModule.findById(moduleId);

  assertFound(courseModule, "Course module not found", 404);

  if (courseModule.status === "archived") {
    throwServiceError(
      "Cannot manage resources under an archived course module",
      400
    );
  }

  return courseModule;
};

const validateResourceConfiguration = ({
  provider,
  cloudinaryPublicId,
  secureUrl,
  externalUrl,
}: {
  provider: "cloudinary" | "external";
  cloudinaryPublicId: string | undefined;
  secureUrl: string | undefined;
  externalUrl: string | undefined;
}): void => {
  if (provider === "cloudinary") {
    if (!cloudinaryPublicId || !secureUrl) {
      throwServiceError(
        "Cloudinary resource requires cloudinaryPublicId and secureUrl",
        400
      );
    }
  }

  if (provider === "external" && !externalUrl) {
    throwServiceError("External resource requires externalUrl", 400);
  }
};

const createModuleResource = async (
  moduleId: string,
  payload: ICreateModuleResource,
  actorId: string
) => {
  await ensureCourseModuleExists(moduleId);

  validateResourceConfiguration({
    provider: payload.provider,
    cloudinaryPublicId: payload.cloudinaryPublicId,
    secureUrl: payload.secureUrl,
    externalUrl: payload.externalUrl,
  });

  const duplicateConditions: Record<string, unknown>[] = [
    { module: moduleId, slug: payload.slug },
    { module: moduleId, order: payload.order },
  ];

  if (payload.cloudinaryPublicId) {
    duplicateConditions.push({
      cloudinaryPublicId: payload.cloudinaryPublicId,
    });
  }

  const existingResource = await ModuleResource.findOne({
    $or: duplicateConditions,
  });

  if (existingResource) {
    throwServiceError(
      "Resource slug, order or Cloudinary public ID already exists",
      409
    );
  }

  const createData: Record<string, unknown> = {
    module: new Types.ObjectId(moduleId),
    title: payload.title,
    slug: payload.slug,
    resourceType: payload.resourceType,
    provider: payload.provider,
    isRequired: payload.isRequired ?? true,
    pointsReward: payload.pointsReward ?? 5,
    order: payload.order,
    status: "draft",
    createdBy: new Types.ObjectId(actorId),
  };

  const optionalValues: Array<[string, unknown]> = [
    ["description", payload.description],
    ["fileName", payload.fileName],
    ["mimeType", payload.mimeType],
    ["format", payload.format],
    ["bytes", payload.bytes],
    ["cloudinaryPublicId", payload.cloudinaryPublicId],
    ["cloudinaryAssetId", payload.cloudinaryAssetId],
    ["cloudinaryResourceType", payload.cloudinaryResourceType],
    ["secureUrl", payload.secureUrl],
    ["externalUrl", payload.externalUrl],
    ["thumbnailUrl", payload.thumbnailUrl],
  ];

  optionalValues.forEach(([key, value]) => {
    if (value !== undefined) {
      createData[key] = value;
    }
  });

  const resource = await ModuleResource.create(createData);

  return resource.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status",
      },
    },
    {
      path: "createdBy",
      select: "fullName email role profileImage",
    },
  ]);
};

const getAllModuleResources = async ({
  actorRole,
  moduleId,
  includeArchived = false,
}: {
  actorRole?: string | undefined;
  moduleId?: string | undefined;
  includeArchived?: boolean | undefined;
}) => {
  const filter: QueryFilter<IModuleResource> = {};

  if (moduleId) {
    filter.module = new Types.ObjectId(moduleId);
  }

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = { $ne: "archived" };
  }

  const query = ModuleResource.find(filter)
    .sort({ module: 1, order: 1 })
    .populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status",
      },
    })
    .populate("createdBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }

  return query;
};

const getResourcesByModule = async (
  moduleId: string,
  actorRole?: string | undefined
) => {
  const moduleFilter: Record<string, unknown> = { _id: moduleId };

  if (!isAdminOrManager(actorRole)) {
    moduleFilter.status = "published";
  }

  const courseModule = await CourseModule.findOne(moduleFilter).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  );

  assertFound(
    courseModule,
    "Course module not found or unavailable",
    404
  );

  const filter: QueryFilter<IModuleResource> = {
    module: new Types.ObjectId(moduleId),
  };

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  } else {
    filter.status = { $ne: "archived" };
  }

  const query = ModuleResource.find(filter)
    .sort({ order: 1 })
    .populate("createdBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }

  const resources = await query;

  return {
    module: courseModule,
    resources,
  };
};

const getSingleModuleResource = async (
  resourceId: string,
  actorRole?: string | undefined
) => {
  const filter: QueryFilter<IModuleResource> = {
    _id: resourceId,
  };

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  }

  const query = ModuleResource.findOne(filter)
    .populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status",
      },
    })
    .populate("createdBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(
      "-secureUrl -externalUrl -cloudinaryPublicId -cloudinaryAssetId"
    );
  }

  const resource = await query;

  assertFound(resource, "Module resource not found", 404);

  return resource;
};

const updateModuleResource = async (
  resourceId: string,
  payload: IUpdateModuleResource,
  actorId: string
) => {
  const resource = await ModuleResource.findById(resourceId);

  assertFound(resource, "Module resource not found", 404);

  if (resource.status === "archived") {
    throwServiceError("Archived resource cannot be updated", 400);
  }

  const nextProvider = payload.provider ?? resource.provider;
  const nextCloudinaryPublicId =
    payload.cloudinaryPublicId === null
      ? undefined
      : payload.cloudinaryPublicId ?? resource.cloudinaryPublicId;
  const nextSecureUrl =
    payload.secureUrl === null
      ? undefined
      : payload.secureUrl ?? resource.secureUrl;
  const nextExternalUrl =
    payload.externalUrl === null
      ? undefined
      : payload.externalUrl ?? resource.externalUrl;

  validateResourceConfiguration({
    provider: nextProvider,
    cloudinaryPublicId: nextCloudinaryPublicId,
    secureUrl: nextSecureUrl,
    externalUrl: nextExternalUrl,
  });

  const duplicateConditions: Record<string, unknown>[] = [];

  if (payload.slug !== undefined) {
    duplicateConditions.push({ module: resource.module, slug: payload.slug });
  }

  if (payload.order !== undefined) {
    duplicateConditions.push({ module: resource.module, order: payload.order });
  }

  if (nextCloudinaryPublicId) {
    duplicateConditions.push({
      cloudinaryPublicId: nextCloudinaryPublicId,
    });
  }

  if (duplicateConditions.length > 0) {
    const duplicateResource = await ModuleResource.findOne({
      _id: { $ne: resource._id },
      $or: duplicateConditions,
    });

    if (duplicateResource) {
      throwServiceError(
        "Resource slug, order or Cloudinary public ID already exists",
        409
      );
    }
  }

  if (payload.title !== undefined) resource.title = payload.title;
  if (payload.slug !== undefined) resource.slug = payload.slug;
  if (payload.resourceType !== undefined) {
    resource.resourceType = payload.resourceType;
  }
  if (payload.provider !== undefined) resource.provider = payload.provider;
  if (payload.isRequired !== undefined) {
    resource.isRequired = payload.isRequired;
  }
  if (payload.pointsReward !== undefined) {
    resource.pointsReward = payload.pointsReward;
  }
  if (payload.order !== undefined) resource.order = payload.order;

  setNullableField(resource, "description", payload.description);
  setNullableField(resource, "fileName", payload.fileName);
  setNullableField(resource, "mimeType", payload.mimeType);
  setNullableField(resource, "format", payload.format);
  setNullableField(resource, "bytes", payload.bytes);
  setNullableField(
    resource,
    "cloudinaryPublicId",
    payload.cloudinaryPublicId
  );
  setNullableField(
    resource,
    "cloudinaryAssetId",
    payload.cloudinaryAssetId
  );
  setNullableField(
    resource,
    "cloudinaryResourceType",
    payload.cloudinaryResourceType
  );
  setNullableField(resource, "secureUrl", payload.secureUrl);
  setNullableField(resource, "externalUrl", payload.externalUrl);
  setNullableField(resource, "thumbnailUrl", payload.thumbnailUrl);

  resource.updatedBy = new Types.ObjectId(actorId);

  await resource.save();

  return resource.populate([
    {
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status",
      },
    },
    {
      path: "updatedBy",
      select: "fullName email role profileImage",
    },
  ]);
};

const publishModuleResource = async (
  resourceId: string,
  actorId: string
) => {
  const resource = await ModuleResource.findById(resourceId);

  assertFound(resource, "Module resource not found", 404);

  if (resource.status === "archived") {
    throwServiceError("Archived resource cannot be published", 400);
  }

  validateResourceConfiguration({
    provider: resource.provider,
    cloudinaryPublicId: resource.cloudinaryPublicId,
    secureUrl: resource.secureUrl,
    externalUrl: resource.externalUrl,
  });

  const courseModule = await CourseModule.findById(resource.module);

  assertFound(courseModule, "Parent course module not found", 404);

  if (courseModule.status !== "published") {
    throwServiceError(
      "Publish the parent course module before publishing this resource",
      400
    );
  }

  resource.status = "published";
  resource.publishedAt = new Date();
  resource.set("archivedAt", undefined);
  resource.updatedBy = new Types.ObjectId(actorId);

  await resource.save();

  return resource;
};

const moveModuleResourceToDraft = async (
  resourceId: string,
  actorId: string
) => {
  const resource = await ModuleResource.findById(resourceId);

  assertFound(resource, "Module resource not found", 404);

  if (resource.status === "archived") {
    throwServiceError("Archived resource cannot be moved to draft", 400);
  }

  resource.status = "draft";
  resource.set("publishedAt", undefined);
  resource.updatedBy = new Types.ObjectId(actorId);

  await resource.save();

  return resource;
};

const archiveModuleResource = async (
  resourceId: string,
  actorId: string
) => {
  const resource = await ModuleResource.findById(resourceId);

  assertFound(resource, "Module resource not found", 404);

  resource.status = "archived";
  resource.archivedAt = new Date();
  resource.set("publishedAt", undefined);
  resource.updatedBy = new Types.ObjectId(actorId);

  await resource.save();

  return resource;
};

export const moduleResourceService = {
  createModuleResource,
  getAllModuleResources,
  getResourcesByModule,
  getSingleModuleResource,
  updateModuleResource,
  publishModuleResource,
  moveModuleResourceToDraft,
  archiveModuleResource,
};
