import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import { ModuleVideo } from "../moduleVideos/module.video.model.schema";
import { ChallengePillar } from "../challengePillars/challenge.pillar.model.schema";
import { userEntitlementService } from "../userEntitlements/userEntitlements.service";

import {
  IRecordVideoHeartbeat,
  IVideoProgress,
  IVideoProgressAdminQuery,
  IWatchedRange,
} from "./video.progress.interface";

import { VideoProgress } from "./video.progress.model.schema";
import throwServiceError from "../../utility/throwServiceError";
import assertFound from "../../utility/assertFound";

const MAX_HEARTBEAT_SEGMENT_SECONDS = 60;

const VIDEO_DURATION_TOLERANCE_SECONDS = 5;

const RANGE_MERGE_TOLERANCE_SECONDS = 0.5;


const assertValidObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(`${fieldName} is invalid`, 400);
  }
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const roundToTwoDecimalPlaces = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const clamp = (value: number, minimum: number, maximum: number): number => {
  return Math.min(Math.max(value, minimum), maximum);
};

const mergeWatchedRanges = (
  existingRanges: IWatchedRange[],
  newRange: IWatchedRange,
): IWatchedRange[] => {
  const sortedRanges = [
    ...existingRanges.map((range) => ({
      startSeconds: range.startSeconds,

      endSeconds: range.endSeconds,
    })),

    {
      startSeconds: newRange.startSeconds,

      endSeconds: newRange.endSeconds,
    },
  ].sort((first, second) => first.startSeconds - second.startSeconds);

  const mergedRanges: IWatchedRange[] = [];

  for (const range of sortedRanges) {
    const lastRange = mergedRanges[mergedRanges.length - 1];

    if (!lastRange) {
      mergedRanges.push({
        startSeconds: range.startSeconds,

        endSeconds: range.endSeconds,
      });

      continue;
    }

    const touchesOrOverlaps =
      range.startSeconds <=
      lastRange.endSeconds + RANGE_MERGE_TOLERANCE_SECONDS;

    if (touchesOrOverlaps) {
      lastRange.endSeconds = Math.max(lastRange.endSeconds, range.endSeconds);
    } else {
      mergedRanges.push({
        startSeconds: range.startSeconds,

        endSeconds: range.endSeconds,
      });
    }
  }

  return mergedRanges;
};

const calculateTotalWatchedSeconds = (
  watchedRanges: IWatchedRange[],
): number => {
  const total = watchedRanges.reduce((sum, range) => {
    return sum + Math.max(0, range.endSeconds - range.startSeconds);
  }, 0);

  return roundToTwoDecimalPlaces(total);
};

const calculateWatchPercent = (
  totalWatchedSeconds: number,
  durationSeconds: number,
): number => {
  if (durationSeconds <= 0) {
    return 0;
  }

  return Math.min(
    100,
    roundToTwoDecimalPlaces((totalWatchedSeconds / durationSeconds) * 100),
  );
};

const ensureVideoIsAvailable = async (videoId: string) => {
  assertValidObjectId(videoId, "Module video ID");

  const video = await ModuleVideo.findById(videoId).select(
    [
      "_id",
      "module",
      "title",
      "slug",
      "thumbnailUrl",
      "durationSeconds",
      "requiredWatchPercent",
      "isRequired",
      "isPaid",
      "order",
      "uploadStatus",
      "status",
    ].join(" "),
  );

  assertFound(video, "Module video not found", 404);

  if (video.status !== "published") {
    throwServiceError("Module video is not published", 403);
  }

  if (video.uploadStatus !== "ready") {
    throwServiceError("Module video is not ready", 403);
  }

  if (video.durationSeconds <= 0) {
    throwServiceError("Module video duration is invalid", 400);
  }

  const courseModule = await CourseModule.findById(video.module).select(
    ["_id", "pillar", "title", "slug", "moduleNumber", "status"].join(" "),
  );

  assertFound(courseModule, "Parent course module not found", 404);

  if (courseModule.status !== "published") {
    throwServiceError("Parent course module is not published", 403);
  }

  return {
    video,
    courseModule,
  };
};

const validateHeartbeatAgainstVideo = (
  payload: IRecordVideoHeartbeat,
  durationSeconds: number,
): IWatchedRange => {
  if (payload.segmentEndSeconds <= payload.segmentStartSeconds) {
    throwServiceError("Segment end must be greater than segment start", 400);
  }

  const segmentLength = payload.segmentEndSeconds - payload.segmentStartSeconds;

  if (segmentLength > MAX_HEARTBEAT_SEGMENT_SECONDS) {
    throwServiceError(
      `A heartbeat segment cannot exceed ${MAX_HEARTBEAT_SEGMENT_SECONDS} seconds`,
      400,
    );
  }

  if (
    payload.segmentStartSeconds >
      durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS ||
    payload.segmentEndSeconds >
      durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS ||
    payload.currentPositionSeconds >
      durationSeconds + VIDEO_DURATION_TOLERANCE_SECONDS
  ) {
    throwServiceError("Heartbeat position exceeds video duration", 400);
  }

  const startSeconds = clamp(payload.segmentStartSeconds, 0, durationSeconds);

  const endSeconds = clamp(payload.segmentEndSeconds, 0, durationSeconds);

  if (endSeconds <= startSeconds) {
    throwServiceError("Heartbeat contains no valid watched duration", 400);
  }

  return {
    startSeconds,
    endSeconds,
  };
};

const populateVideoProgress = async (
  progress: InstanceType<typeof VideoProgress>,
) => {
  return progress.populate([
    {
      path: "video",

      select: [
        "title",
        "slug",
        "thumbnailUrl",
        "durationSeconds",
        "requiredWatchPercent",
        "isRequired",
        "isPaid",
        "order",
        "status",
      ].join(" "),
    },
    {
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name slug title status",
      },
    },
  ]);
};

const recordVideoHeartbeat = async (
  userId: string,
  videoId: string,
  payload: IRecordVideoHeartbeat,
) => {
  assertValidObjectId(userId, "User ID");

  const { video, courseModule } = await ensureVideoIsAvailable(videoId);

  if (courseModule.pillar) {
    const pillar = await ChallengePillar.findById(courseModule.pillar).select(
      "isPaid status"
    );
    if (pillar?.isPaid || video.isPaid) {
      const access = await userEntitlementService.checkPillarAccess(
        userId,
        String(courseModule.pillar)
      );
      if (!access.hasAccess) {
        throwServiceError(
          "Active pillar access required to track video progress",
          403
        );
      }
    }
  }

  const durationSeconds = video.durationSeconds;

  const requiredWatchPercent = video.requiredWatchPercent ?? 80;

  const newWatchedRange = validateHeartbeatAgainstVideo(
    payload,
    durationSeconds,
  );

  const progressFilter: QueryFilter<IVideoProgress> = {
    user: new Types.ObjectId(userId),

    video: new Types.ObjectId(videoId),
  };

  let progress = await VideoProgress.findOne(progressFilter);

  const now = new Date();

  if (!progress) {
    const watchedRanges = mergeWatchedRanges([], newWatchedRange);

    const totalWatchedSeconds = calculateTotalWatchedSeconds(watchedRanges);

    const watchPercent = calculateWatchPercent(
      totalWatchedSeconds,
      durationSeconds,
    );

    const isCompleted = watchPercent >= requiredWatchPercent;

    const createData: Record<string, unknown> = {
      user: new Types.ObjectId(userId),

      video: new Types.ObjectId(videoId),

      module: courseModule._id,

      durationSecondsSnapshot: durationSeconds,

      requiredWatchPercentSnapshot: requiredWatchPercent,

      watchedRanges,

      totalWatchedSeconds,

      watchPercent,

      lastPositionSeconds: clamp(
        payload.currentPositionSeconds,
        0,
        durationSeconds,
      ),

      isCompleted,

      startedAt: now,

      lastWatchedAt: now,
    };

    if (isCompleted) {
      createData.completedAt = now;
    }

    try {
      progress = await VideoProgress.create(createData);

      return populateVideoProgress(progress);
    } catch (error) {
      /**
       * Two simultaneous first heartbeats may
       * attempt to create the same document.
       */
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      progress = await VideoProgress.findOne(progressFilter);

      assertFound(progress, "Video progress could not be created", 500);
    }
  }

  const currentRanges = progress.watchedRanges.map((range) => ({
    startSeconds: range.startSeconds,

    endSeconds: range.endSeconds,
  }));

  const mergedRanges = mergeWatchedRanges(currentRanges, newWatchedRange);

  const totalWatchedSeconds = calculateTotalWatchedSeconds(mergedRanges);

  const watchPercent = calculateWatchPercent(
    totalWatchedSeconds,
    durationSeconds,
  );

  const reachedCompletion = watchPercent >= requiredWatchPercent;

  const newlyCompleted = !progress.isCompleted && reachedCompletion;

  progress.module = courseModule._id;

  progress.durationSecondsSnapshot = durationSeconds;

  progress.requiredWatchPercentSnapshot = requiredWatchPercent;

  progress.set("watchedRanges", mergedRanges);

  progress.totalWatchedSeconds = totalWatchedSeconds;

  progress.watchPercent = watchPercent;

  progress.lastPositionSeconds = clamp(
    payload.currentPositionSeconds,
    0,
    durationSeconds,
  );

  progress.lastWatchedAt = now;

  /**
   * Completion is monotonic.
   * Once completed, ordinary heartbeat cannot
   * make it incomplete again.
   */
  progress.isCompleted = progress.isCompleted || reachedCompletion;

  if (newlyCompleted) {
    progress.completedAt = now;
  }

  await progress.save();

  try {
    const { moduleProgressService } = await import(
      "../moduleProgress/module.progress.service"
    );
    await moduleProgressService.refreshModuleProgress(
      userId,
      courseModule._id.toString(),
    );
  } catch (syncError) {
    // eslint-disable-next-line no-console
    console.error("Auto sync module progress failed on heartbeat:", syncError);
  }

  return populateVideoProgress(progress);
};

const getMyVideoProgress = async (userId: string, videoId: string) => {
  assertValidObjectId(userId, "User ID");

  const { video, courseModule } = await ensureVideoIsAvailable(videoId);

  const filter: QueryFilter<IVideoProgress> = {
    user: new Types.ObjectId(userId),

    video: new Types.ObjectId(videoId),
  };

  const progress = await VideoProgress.findOne(filter);

  return {
    video: {
      id: video._id,
      title: video.title,
      slug: video.slug,

      thumbnailUrl: video.thumbnailUrl,

      durationSeconds: video.durationSeconds,

      requiredWatchPercent: video.requiredWatchPercent,

      isRequired: video.isRequired,

      isPaid: video.isPaid,

      order: video.order,
    },

    module: {
      id: courseModule._id,

      title: courseModule.title,

      slug: courseModule.slug,

      moduleNumber: courseModule.moduleNumber,

      pillar: courseModule.pillar,
    },

    progress: progress
      ? {
          id: progress._id,

          totalWatchedSeconds: progress.totalWatchedSeconds,

          watchPercent: progress.watchPercent,

          lastPositionSeconds: progress.lastPositionSeconds,

          isCompleted: progress.isCompleted,

          completedAt: progress.completedAt,

          lastWatchedAt: progress.lastWatchedAt,
        }
      : {
          id: null,

          totalWatchedSeconds: 0,

          watchPercent: 0,

          lastPositionSeconds: 0,

          isCompleted: false,

          completedAt: null,

          lastWatchedAt: null,
        },
  };
};

const getMyModuleVideoProgress = async (userId: string, moduleId: string) => {
  assertValidObjectId(userId, "User ID");

  assertValidObjectId(moduleId, "Course module ID");

  const courseModule = await CourseModule.findById(moduleId)
    .select(
      [
        "_id",
        "pillar",
        "title",
        "slug",
        "moduleNumber",
        "minimumVideoPercent",
        "status",
      ].join(" "),
    )
    .populate("pillar", "name slug title status");

  assertFound(courseModule, "Course module not found", 404);

  if (courseModule.status !== "published") {
    throwServiceError("Course module is not published", 403);
  }

  const videos = await ModuleVideo.find({
    module: new Types.ObjectId(moduleId),

    status: "published",
  })
    .select(
      [
        "_id",
        "title",
        "slug",
        "thumbnailUrl",
        "durationSeconds",
        "requiredWatchPercent",
        "isRequired",
        "isPaid",
        "pointsReward",
        "order",
      ].join(" "),
    )
    .sort({ order: 1 })
    .lean();

  const videoIds = videos.map((video) => video._id);

  const progressFilter: QueryFilter<IVideoProgress> = {
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),

    video: {
      $in: videoIds,
    },
  };

  const progressDocuments =
    videoIds.length > 0 ? await VideoProgress.find(progressFilter).lean() : [];

  const progressByVideoId = new Map(
    progressDocuments.map((progress) => [progress.video.toString(), progress]),
  );

  const videosWithProgress = videos.map((video) => {
    const progress = progressByVideoId.get(video._id.toString());

    return {
      ...video,

      progress: progress
        ? {
            totalWatchedSeconds: progress.totalWatchedSeconds,

            watchPercent: progress.watchPercent,

            lastPositionSeconds: progress.lastPositionSeconds,

            isCompleted: progress.isCompleted,

            completedAt: progress.completedAt,

            lastWatchedAt: progress.lastWatchedAt,
          }
        : {
            totalWatchedSeconds: 0,

            watchPercent: 0,

            lastPositionSeconds: 0,

            isCompleted: false,

            completedAt: null,

            lastWatchedAt: null,
          },
    };
  });

  const requiredVideos = videosWithProgress.filter((video) => video.isRequired);

  const completedRequiredVideos = requiredVideos.filter(
    (video) => video.progress.isCompleted,
  ).length;

  const requiredVideoCompletionPercent =
    requiredVideos.length === 0
      ? 100
      : roundToTwoDecimalPlaces(
          (completedRequiredVideos / requiredVideos.length) * 100,
        );

  const allRequiredVideosCompleted =
    requiredVideos.length === 0 ||
    completedRequiredVideos === requiredVideos.length;

  return {
    module: courseModule,

    summary: {
      totalVideos: videos.length,

      totalRequiredVideos: requiredVideos.length,

      completedRequiredVideos,

      requiredVideoCompletionPercent,

      allRequiredVideosCompleted,
    },

    videos: videosWithProgress,
  };
};

const getMyAllVideoProgress = async (userId: string) => {
  assertValidObjectId(userId, "User ID");

  const filter: QueryFilter<IVideoProgress> = {
    user: new Types.ObjectId(userId),
  };

  return VideoProgress.find(filter)
    .sort({
      lastWatchedAt: -1,
    })
    .populate(
      "video",
      [
        "title",
        "slug",
        "thumbnailUrl",
        "durationSeconds",
        "requiredWatchPercent",
        "isRequired",
        "isPaid",
        "order",
        "status",
      ].join(" "),
    )
    .populate({
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name slug title status",
      },
    });
};

const getAllVideoProgress = async (query: IVideoProgressAdminQuery) => {
  const filter: QueryFilter<IVideoProgress> = {};

  if (query.userId) {
    assertValidObjectId(query.userId, "User ID");

    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.videoId) {
    assertValidObjectId(query.videoId, "Module video ID");

    filter.video = new Types.ObjectId(query.videoId);
  }

  if (query.moduleId) {
    assertValidObjectId(query.moduleId, "Course module ID");

    filter.module = new Types.ObjectId(query.moduleId);
  }

  if (query.isCompleted !== undefined) {
    filter.isCompleted = query.isCompleted;
  }

  const page = query.page ?? 1;

  const limit = query.limit ?? 20;

  const skip = (page - 1) * limit;

  const [progressRecords, total] = await Promise.all([
    VideoProgress.find(filter)
      .sort({
        lastWatchedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email role profileImage")
      .populate(
        "video",
        [
          "title",
          "slug",
          "thumbnailUrl",
          "durationSeconds",
          "requiredWatchPercent",
          "isRequired",
          "isPaid",
          "order",
          "status",
        ].join(" "),
      )
      .populate({
        path: "module",

        select: "title slug moduleNumber pillar status",

        populate: {
          path: "pillar",
          model: "ChallengePillar",

          select: "name slug title status",
        },
      }),

    VideoProgress.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),
    },

    data: progressRecords,
  };
};

export const videoProgressService = {
  recordVideoHeartbeat,

  getMyVideoProgress,

  getMyModuleVideoProgress,

  getMyAllVideoProgress,

  getAllVideoProgress,
};
