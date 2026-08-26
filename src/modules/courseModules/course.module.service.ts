import { Types } from 'mongoose';

import { ChallengePillar } from '../challengePillars/challenge.pillar.model.schema';

import {
  ICreateCourseModule,
  IUpdateCourseModule,
} from './course.module.interface';

import { CourseModule } from './course.module.model.schema';

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

function assertCourseExists<T>(
  pillar: T | null | undefined,
  message = 'Challenge pillar not found'
): asserts pillar is T {
  if (!pillar) {
    throwServiceError(message, 404);
  }
}

const isAdminOrManager = (
  role?: string
): boolean => {
  return role === 'admin' || role === 'manager';
};

const createCourseModule = async (
  payload: ICreateCourseModule,
  actorId: string
) => {
  const pillar =
    await ChallengePillar.findById(
      payload.pillar
    );


    assertCourseExists(pillar)

  if (!pillar) {
    throwServiceError(
      'Challenge pillar not found',
      404
    );
  }

  if (pillar.status === 'archived') {
    throwServiceError(
      'Cannot create module under archived pillar',
      400
    );
  }

  const existingModule =
    await CourseModule.findOne({
      pillar: payload.pillar,

      $or: [
        {
          slug: payload.slug,
        },
        {
          moduleNumber:
            payload.moduleNumber,
        },
      ],
    }).lean();

  if (existingModule) {
    throwServiceError(
      'Module slug or module number already exists in this pillar',
      409
    );
  }

  const courseModule =
    await CourseModule.create({
      ...payload,

      pillar:
        new Types.ObjectId(
          payload.pillar
        ),

      estimatedDurationMinutes:
        payload.estimatedDurationMinutes ??
        0,

      minimumVideoPercent:
        payload.minimumVideoPercent ??
        80,

      minimumActionPercent:
        payload.minimumActionPercent ??
        80,

      minimumQuizScore:
        payload.minimumQuizScore ??
        70,

      maximumQuizAttempts:
        payload.maximumQuizAttempts ??
        2,

      completionPoints:
        payload.completionPoints ??
        20,

      status: 'draft',

      createdBy:
        new Types.ObjectId(actorId),
    });

  return courseModule.populate([
    {
      path: 'pillar',
      select:
        'name slug title isPaid priceCents currency status',
    },
    {
      path: 'createdBy',
      select:
        'fullName email role profileImage',
    },
  ]);
};

const getAllCourseModules = async ({
  actorRole,
  pillarId,
  includeArchived = false,
}: {
 actorRole?: string | undefined;
  pillarId?: string | undefined;
  includeArchived?: boolean | undefined;
}) => {
  const filter: Record<string, unknown> = {};

  if (pillarId) {
    filter.pillar =
      new Types.ObjectId(pillarId);
  }

  if (!isAdminOrManager(actorRole)) {
    filter.status = 'published';
  } else if (!includeArchived) {
    filter.status = {
      $ne: 'archived',
    };
  }

  return CourseModule.find(filter)
    .sort({
      pillar: 1,
      moduleNumber: 1,
    })
    .populate(
      'pillar',
      'name slug title isPaid priceCents currency status'
    )
    .populate(
      'createdBy',
      'fullName email role profileImage'
    )
    .populate(
      'updatedBy',
      'fullName email role profileImage'
    ).lean();
};

const getModulesByPillar = async (
  pillarId: string,
  actorRole?: string
) => {
  const pillarFilter: Record<
    string,
    unknown
  > = {
    _id: pillarId,
  };

  if (!isAdminOrManager(actorRole)) {
    pillarFilter.status = 'published';
  }

  const pillar =
    await ChallengePillar.findOne(
      pillarFilter
    ).lean();

  if (!pillar) {
    throwServiceError(
      'Challenge pillar not found or unavailable',
      404
    );
  }

  const moduleFilter: Record<
    string,
    unknown
  > = {
    pillar: pillarId,
  };

  if (!isAdminOrManager(actorRole)) {
    moduleFilter.status = 'published';
  } else {
    moduleFilter.status = {
      $ne: 'archived',
    };
  }

  const modules =
    await CourseModule.find(
      moduleFilter
    )
      .sort({ moduleNumber: 1 })
      .populate(
        'pillar',
        'name slug title isPaid priceCents currency status'
      ).lean();

  return {
    pillar,
    modules,
  };
};

const getSingleCourseModule = async (
  moduleId: string,
  actorRole?: string
) => {
  const filter: Record<string, unknown> = {
    _id: moduleId,
  };

  if (!isAdminOrManager(actorRole)) {
    filter.status = 'published';
  }

  const courseModule =
    await CourseModule.findOne(filter)
      .populate(
        'pillar',
        'name slug title isPaid priceCents currency status'
      )
      .populate(
        'createdBy',
        'fullName email role profileImage'
      )
      .populate(
        'updatedBy',
        'fullName email role profileImage'
      ).lean();

  if (!courseModule) {
    throwServiceError(
      'Course module not found',
      404
    );
  }

  return courseModule;
};

const updateCourseModule = async (
  moduleId: string,
  payload: IUpdateCourseModule,
  actorId: string
) => {
  const courseModule =
    await CourseModule.findById(
      moduleId
    );

    assertCourseExists(courseModule)

  if (!courseModule) {
    throwServiceError(
      'Course module not found',
      404
    );
  }

  if (
    courseModule?.status === 'archived'
  ) {
    throwServiceError(
      'Archived module cannot be updated',
      400
    );
  }

  if (
    payload.slug !== undefined ||
    payload.moduleNumber !== undefined
  ) {
    const duplicateConditions: Record<
      string,
      unknown
    >[] = [];

    if (payload.slug !== undefined) {
      duplicateConditions.push({
        slug: payload.slug,
      });
    }

    if (
      payload.moduleNumber !== undefined
    ) {
      duplicateConditions.push({
        moduleNumber:
          payload.moduleNumber,
      });
    }

    const duplicateModule =
      await CourseModule.findOne({
        _id: {
          $ne: courseModule._id,
        },

        pillar: courseModule.pillar,

        $or: duplicateConditions,
      });

    if (duplicateModule) {
      throwServiceError(
        'Module slug or module number already exists in this pillar',
        409
      );
    }
  }

  if (payload.title !== undefined) {
    courseModule.title =
      payload.title;
  }

  if (payload.slug !== undefined) {
    courseModule.slug =
      payload.slug;
  }

  if (
    payload.shortDescription === null
  ) {
    courseModule.shortDescription =
      undefined;
  } else if (
    payload.shortDescription !==
    undefined
  ) {
    courseModule.shortDescription =
      payload.shortDescription;
  }

  if (
    payload.description !== undefined
  ) {
    courseModule.description =
      payload.description;
  }

  if (payload.thumbnailUrl === null) {
    courseModule.thumbnailUrl =
      undefined;
  } else if (
    payload.thumbnailUrl !== undefined
  ) {
    courseModule.thumbnailUrl =
      payload.thumbnailUrl;
  }

  if (
    payload.moduleNumber !== undefined
  ) {
    courseModule.moduleNumber =
      payload.moduleNumber;
  }

  if (
    payload.estimatedDurationMinutes !==
    undefined
  ) {
    courseModule.estimatedDurationMinutes =
      payload.estimatedDurationMinutes;
  }

  if (
    payload.minimumVideoPercent !==
    undefined
  ) {
    courseModule.minimumVideoPercent =
      payload.minimumVideoPercent;
  }

  if (
    payload.minimumActionPercent !==
    undefined
  ) {
    courseModule.minimumActionPercent =
      payload.minimumActionPercent;
  }

  if (
    payload.minimumQuizScore !==
    undefined
  ) {
    courseModule.minimumQuizScore =
      payload.minimumQuizScore;
  }

  if (
    payload.maximumQuizAttempts !==
    undefined
  ) {
    courseModule.maximumQuizAttempts =
      payload.maximumQuizAttempts;
  }

  if (
    payload.completionPoints !==
    undefined
  ) {
    courseModule.completionPoints =
      payload.completionPoints;
  }

  courseModule.updatedBy =
    new Types.ObjectId(actorId);

  await courseModule.save();

  return courseModule.populate([
    {
      path: 'pillar',
      select:
        'name slug title isPaid priceCents currency status',
    },
    {
      path: 'updatedBy',
      select:
        'fullName email role profileImage',
    },
  ]);
};

const publishCourseModule = async (
  moduleId: string,
  actorId: string
) => {
  const courseModule =
    await CourseModule.findById(
      moduleId
    );

    assertCourseExists(courseModule)

  if (!courseModule) {
    throwServiceError(
      'Course module not found',
      404
    );
  }

  if (
    courseModule.status === 'archived'
  ) {
    throwServiceError(
      'Archived module cannot be published',
      400
    );
  }

  const pillar =
    await ChallengePillar.findById(
      courseModule.pillar
    );

    assertCourseExists(pillar)

  if (!pillar) {
    throwServiceError(
      'Parent challenge pillar not found',
      404
    );
  }

  if (pillar.status !== 'published') {
    throwServiceError(
      'Publish the parent challenge pillar before publishing this module',
      400
    );
  }

  courseModule.status = 'published';
  courseModule.publishedAt =
    new Date();

  courseModule.archivedAt =
    undefined;

  courseModule.updatedBy =
    new Types.ObjectId(actorId);

  await courseModule.save();

  return courseModule;
};

const moveCourseModuleToDraft = async (
  moduleId: string,
  actorId: string
) => {
  const courseModule =
    await CourseModule.findById(
      moduleId
    );

    assertCourseExists(courseModule)

  if (!courseModule) {
    throwServiceError(
      'Course module not found',
      404
    );
  }

  if (
    courseModule.status === 'archived'
  ) {
    throwServiceError(
      'Archived module cannot be moved to draft',
      400
    );
  }

  courseModule.status = 'draft';
  courseModule.publishedAt =
    undefined;

  courseModule.updatedBy =
    new Types.ObjectId(actorId);

  await courseModule.save();

  return courseModule;
};

const archiveCourseModule = async (
  moduleId: string,
  actorId: string
) => {
  const courseModule =
    await CourseModule.findById(
      moduleId
    );

    assertCourseExists(courseModule)

  if (!courseModule) {
    throwServiceError(
      'Course module not found',
      404
    );
  }

  courseModule.status = 'archived';
  courseModule.archivedAt =
    new Date();

  courseModule.publishedAt =
    undefined;

  courseModule.updatedBy =
    new Types.ObjectId(actorId);

  await courseModule.save();

  return courseModule;
};

export const courseModuleService = {
  createCourseModule,

  getAllCourseModules,
  getModulesByPillar,
  getSingleCourseModule,

  updateCourseModule,

  publishCourseModule,
  moveCourseModuleToDraft,
  archiveCourseModule,
};