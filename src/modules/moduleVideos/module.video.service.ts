import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import {
  ICreateModuleVideo,
  IModuleVideo,
  IUpdateModuleVideo,
} from "./module.video.interface";
import { ModuleVideo } from "./module.video.model.schema";
import { userEntitlementService } from "../userEntitlements/userEntitlements.service";

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

const isAdminOrManager = (role?: string | undefined): boolean => {
  return role === "admin" || role === "manager";
};

const setNullableField = (
  document: { set: (path: string, value: unknown) => unknown },
  path: string,
  value: unknown,
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
      "Cannot manage videos under an archived course module",
      400,
    );
  }

  return courseModule;
};

const createModuleVideo = async (
  moduleId: string,
  payload: ICreateModuleVideo,
  actorId: string,
) => {
  await ensureCourseModuleExists(moduleId);

  const existingVideo = await ModuleVideo.findOne({
    $or: [
      { module: moduleId, slug: payload.slug },
      { module: moduleId, order: payload.order },
      { cloudinaryPublicId: payload.cloudinaryPublicId },
    ],
  });

  if (existingVideo) {
    throwServiceError(
      "Video slug, order or Cloudinary public ID already exists",
      409,
    );
  }

  const createData: Record<string, unknown> = {
    module: new Types.ObjectId(moduleId),
    title: payload.title,
    slug: payload.slug,
    provider: "cloudinary",
    resourceType: "video",
    cloudinaryPublicId: payload.cloudinaryPublicId,
    secureUrl: payload.secureUrl,
    durationSeconds: payload.durationSeconds,
    isPaid: payload.isPaid ?? false,
    isRequired: payload.isRequired ?? true,
    requiredWatchPercent: payload.requiredWatchPercent ?? 80,
    pointsReward: payload.pointsReward ?? 10,
    order: payload.order,
    uploadStatus: payload.uploadStatus ?? "ready",
    status: "draft",
    uploadedBy: new Types.ObjectId(actorId),
  };

  const optionalValues: Array<[string, unknown]> = [
    ["description", payload.description],
    ["cloudinaryAssetId", payload.cloudinaryAssetId],
    ["playbackUrl", payload.playbackUrl],
    ["thumbnailUrl", payload.thumbnailUrl],
    ["folder", payload.folder],
    ["format", payload.format],
    ["bytes", payload.bytes],
    ["width", payload.width],
    ["height", payload.height],
  ];

  optionalValues.forEach(([key, value]) => {
    if (value !== undefined) {
      createData[key] = value;
    }
  });

  const video = await ModuleVideo.create(createData);

  return video.populate([
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
      path: "uploadedBy",
      select: "fullName email role profileImage",
    },
  ]);
};

const getAllModuleVideos = async ({
  actorRole,
  moduleId,
  includeArchived = false,
}: {
  actorRole?: string | undefined;
  moduleId?: string | undefined;
  includeArchived?: boolean | undefined;
}) => {
  const filter: QueryFilter<IModuleVideo> = {};

  if (moduleId) {
    filter.module = new Types.ObjectId(moduleId);
  }

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published" ;

  } else if (!includeArchived) {
    filter.status = { $ne: "archived" };
  }

  const query = ModuleVideo.find()
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
    .populate("uploadedBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(
      "-secureUrl -playbackUrl -cloudinaryPublicId -cloudinaryAssetId",
    );
  }

  return query.lean();
};

const getVideosByModule = async (
  moduleId: string,
  actorRole?: string | undefined,
) => {
  const moduleFilter: Record<string, unknown> = { _id: moduleId };

  if (!isAdminOrManager(actorRole)) {
    moduleFilter.status = "published";
  }

  const courseModule = await CourseModule.findOne(moduleFilter).populate(
    "pillar",
    "name slug title isPaid priceCents currency status"
  ).lean();

  assertFound(courseModule, "Course module not found or unavailable", 404);

  const filter: QueryFilter<IModuleVideo> = {
    module: new Types.ObjectId(moduleId),
  };

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  } else {
    filter.status = { $ne: "archived" };
  }

  const query = ModuleVideo.find(filter)
    .sort({ order: 1 })
    .populate("uploadedBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(
      "-secureUrl -playbackUrl -cloudinaryPublicId -cloudinaryAssetId",
    );
  }

  const videos = await query.lean();

  return {
    module: courseModule,
    videos,
  };
};

const getSingleModuleVideo = async (
  videoId: string,
  actorRole?: string | undefined,
) => {
  const filter: QueryFilter<IModuleVideo> = {
    _id: videoId,
    // status : "published"
  };

  const isPrivileged = isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  }

  const query = ModuleVideo.findOne(filter)
    .populate({
      path: "module",
      select: "title slug moduleNumber pillar status",
      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select: "name slug title isPaid priceCents currency status  ",
      },
    })
    .populate("uploadedBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage");

  if (!isPrivileged) {
    query.select(" -cloudinaryPublicId -cloudinaryAssetId");
  }

  const video = await query.lean();

  assertFound(video, "Module video not found", 404);

  return video;
};

const checkVideoAccess = async (videoId: string, userId: string) => {
  const video = await ModuleVideo.findById(videoId).populate({
    path: "module",
    select: "title slug moduleNumber pillar status",
    populate: {
      path: "pillar",
      model: "ChallengePillar",
      select: "name slug title isPaid priceCents currency status",
    },
  });

  assertFound(video, "Module video not found", 404);

  const moduleData = video.module as unknown as {
    _id: Types.ObjectId;
    pillar?: {
      _id: Types.ObjectId;
      name: string;
      slug: string;
      title: string;
      isPaid: boolean;
      priceCents: number;
      currency: string;
      status: string;
    } | string;
  };

  const pillarObj =
    typeof moduleData?.pillar === "object" && moduleData?.pillar !== null
      ? moduleData.pillar
      : null;

  const isPillarPaid = pillarObj?.isPaid === true;
  const isVideoPaid = video.isPaid === true;

  // If neither the pillar nor the video is marked as paid, it is free
  if (!isPillarPaid && !isVideoPaid) {
    return {
      canWatch: true,
      isLocked: false,
      reason: "free_video",
      playbackUrl: video.playbackUrl ?? video.secureUrl,
    };
  }

  const pillarId = pillarObj?._id
    ? String(pillarObj._id)
    : typeof moduleData?.pillar === "string"
      ? moduleData.pillar
      : undefined;

  if (!pillarId) {
    return {
      canWatch: false,
      isLocked: true,
      paymentRequired: true,
      reason: "pillar_purchase_required",
      playbackUrl: null,
      secureUrl: null,
    };
  }

  const access = await userEntitlementService.checkPillarAccess(
    userId,
    pillarId,
  );

  if (!access.hasAccess) {
    return {
      canWatch: false,
      isLocked: true,
      paymentRequired: true,
      reason: "pillar_purchase_required",
      playbackUrl: null,
      secureUrl: null,
      pillar: access.pillar ?? pillarObj,
    };
  }

  return {
    canWatch: true,
    isLocked: false,
    paymentRequired: false,
    reason: "pillar_entitlement_active",
    playbackUrl: video.playbackUrl ?? video.secureUrl,
  };
};

const updateModuleVideo = async (
  videoId: string,
  payload: IUpdateModuleVideo,
  actorId: string,
) => {
  const video = await ModuleVideo.findById(videoId);

  assertFound(video, "Module video not found", 404);

  if (video.status === "archived") {
    throwServiceError("Archived video cannot be updated", 400);
  }

  const duplicateConditions: Record<string, unknown>[] = [];

  if (payload.slug !== undefined) {
    duplicateConditions.push({ module: video.module, slug: payload.slug });
  }

  if (payload.order !== undefined) {
    duplicateConditions.push({ module: video.module, order: payload.order });
  }

  if (payload.cloudinaryPublicId !== undefined) {
    duplicateConditions.push({
      cloudinaryPublicId: payload.cloudinaryPublicId,
    });
  }

  if (duplicateConditions.length > 0) {
    const duplicateVideo = await ModuleVideo.findOne({
      _id: { $ne: video._id },
      $or: duplicateConditions,
    });

    if (duplicateVideo) {
      throwServiceError(
        "Video slug, order or Cloudinary public ID already exists",
        409,
      );
    }
  }

  if (payload.title !== undefined) video.title = payload.title;
  if (payload.slug !== undefined) video.slug = payload.slug;
  if (payload.cloudinaryPublicId !== undefined) {
    video.cloudinaryPublicId = payload.cloudinaryPublicId;
  }
  if (payload.secureUrl !== undefined) video.secureUrl = payload.secureUrl;
  if (payload.durationSeconds !== undefined) {
    video.durationSeconds = payload.durationSeconds;
    if (payload.isPaid !== undefined) {
      video.isPaid = payload.isPaid;
    }
  }
  if (payload.isRequired !== undefined) video.isRequired = payload.isRequired;
  if (payload.requiredWatchPercent !== undefined) {
    video.requiredWatchPercent = payload.requiredWatchPercent;
  }
  if (payload.pointsReward !== undefined) {
    video.pointsReward = payload.pointsReward;
  }
  if (payload.order !== undefined) video.order = payload.order;
  if (payload.uploadStatus !== undefined) {
    video.uploadStatus = payload.uploadStatus;
  }

  setNullableField(video, "description", payload.description);
  setNullableField(video, "cloudinaryAssetId", payload.cloudinaryAssetId);
  setNullableField(video, "playbackUrl", payload.playbackUrl);
  setNullableField(video, "thumbnailUrl", payload.thumbnailUrl);
  setNullableField(video, "folder", payload.folder);
  setNullableField(video, "format", payload.format);
  setNullableField(video, "bytes", payload.bytes);
  setNullableField(video, "width", payload.width);
  setNullableField(video, "height", payload.height);

  video.updatedBy = new Types.ObjectId(actorId);

  await video.save();

  return video.populate([
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

const publishModuleVideo = async (videoId: string, actorId: string) => {
  const video = await ModuleVideo.findById(videoId);

  assertFound(video, "Module video not found", 404);

  if (video.status === "archived") {
    throwServiceError("Archived video cannot be published", 400);
  }

  if (video.uploadStatus !== "ready") {
    throwServiceError("Video upload must be ready before publishing", 400);
  }

  const courseModule = await CourseModule.findById(video.module);

  assertFound(courseModule, "Parent course module not found", 404);

  if (courseModule.status !== "published") {
    throwServiceError(
      "Publish the parent course module before publishing this video",
      400,
    );
  }

  video.status = "published";
  video.publishedAt = new Date();
  video.set("archivedAt", undefined);
  video.updatedBy = new Types.ObjectId(actorId);

  await video.save();

  return video;
};

const moveModuleVideoToDraft = async (videoId: string, actorId: string) => {
  const video = await ModuleVideo.findById(videoId);

  assertFound(video, "Module video not found", 404);

  if (video.status === "archived") {
    throwServiceError("Archived video cannot be moved to draft", 400);
  }

  video.status = "draft";
  video.set("publishedAt", undefined);
  video.updatedBy = new Types.ObjectId(actorId);

  await video.save();

  return video;
};

const archiveModuleVideo = async (videoId: string, actorId: string) => {
  const video = await ModuleVideo.findById(videoId);

  assertFound(video, "Module video not found", 404);

  video.status = "archived";
  video.archivedAt = new Date();
  video.set("publishedAt", undefined);
  video.updatedBy = new Types.ObjectId(actorId);

  await video.save();

  return video;
};

export const moduleVideoService = {
  createModuleVideo,
  getAllModuleVideos,
  getVideosByModule,
  getSingleModuleVideo,
  checkVideoAccess,
  updateModuleVideo,
  publishModuleVideo,
  moveModuleVideoToDraft,
  archiveModuleVideo,
};
