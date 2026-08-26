import {
  QueryFilter,
  Types,
} from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";

import {
  ICreateModuleAction,
  IModuleAction,
  IUpdateModuleAction,
} from "./module.action.interface";

import { ModuleAction } from "./module.action.model.schema";

const throwServiceError = (
  message: string,
  statusCode: number
): never => {
  const error = new Error(
    message
  ) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number
) => asserts value is T = (
  value,
  message,
  statusCode
) => {
  if (
    value === null ||
    value === undefined
  ) {
    throwServiceError(
      message,
      statusCode
    );
  }
};

const assertValidObjectId = (
  value: string,
  fieldName: string
): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(
      `${fieldName} is invalid`,
      400
    );
  }
};

const isAdminOrManager = (
  role?: string | undefined
): boolean => {
  return (
    role === "admin" ||
    role === "manager"
  );
};

const isDuplicateKeyError = (
  error: unknown
): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number })
      .code === 11000
  );
};

const ensureCourseModuleExists =
  async (moduleId: string) => {
    assertValidObjectId(
      moduleId,
      "Course module ID"
    );

    const courseModule =
      await CourseModule.findById(
        moduleId
      );

    assertFound(
      courseModule,
      "Course module not found",
      404
    );

    if (
      courseModule.status ===
      "archived"
    ) {
      throwServiceError(
        "Cannot manage actions under an archived course module",
        400
      );
    }

    return courseModule;
  };

const createModuleAction = async (
  moduleId: string,
  payload: ICreateModuleAction,
  actorId: string
) => {
  await ensureCourseModuleExists(
    moduleId
  );

  const existingAction =
    await ModuleAction.findOne({
      module: moduleId,
      order: payload.order,
    }).lean();

  if (existingAction) {
    throwServiceError(
      "Action order already exists in this module",
      409
    );
  }

  const createData: Record<
    string,
    unknown
  > = {
    module:
      new Types.ObjectId(moduleId),

    title: payload.title,

    order: payload.order,

    isRequired:
      payload.isRequired ?? true,

    pointsReward:
      payload.pointsReward ?? 5,

    status: "draft",

    createdBy:
      new Types.ObjectId(actorId),
  };

  if (
    payload.description !== undefined
  ) {
    createData.description =
      payload.description;
  }

  try {
    const action =
      await ModuleAction.create(
        createData
      );

    return action.populate([
      {
        path: "module",
        select:
          "title slug moduleNumber pillar status",

        populate: {
          path: "pillar",
          model: "ChallengePillar",
          select:
            "name slug title status",
        },
      },
      {
        path: "createdBy",
        select:
          "fullName email role profileImage",
      },
    ]);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "Action order already exists in this module",
        409
      );
    }

    throw error;
  }
};

const getAllModuleActions = async ({
  actorRole,
  moduleId,
  includeArchived = false,
}: {
  actorRole?: string | undefined;
  moduleId?: string | undefined;
  includeArchived?: boolean | undefined;
}) => {
  const filter: QueryFilter<
    IModuleAction
  > = {};

  if (moduleId) {
    assertValidObjectId(
      moduleId,
      "Course module ID"
    );

    filter.module =
      new Types.ObjectId(moduleId);
  }

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived",
    };
  }

  return ModuleAction.find(filter)
    .sort({
      module: 1,
      order: 1,
    })
    .populate({
      path: "module",
      select:
        "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select:
          "name slug title status",
      },
    })
    .populate(
      "createdBy",
      "fullName email role profileImage"
    )
    .populate(
      "updatedBy",
      "fullName email role profileImage"
    ).lean();
};

const getActionsByModule = async (
  moduleId: string,
  actorRole?: string | undefined
) => {
  assertValidObjectId(
    moduleId,
    "Course module ID"
  );

  const isPrivileged =
    isAdminOrManager(actorRole);

  const moduleFilter: Record<
    string,
    unknown
  > = {
    _id: moduleId,
  };

  if (!isPrivileged) {
    moduleFilter.status =
      "published";
  }

  const courseModule =
    await CourseModule.findOne(
      moduleFilter
    ).populate(
      "pillar",
      "name slug title status"
    ).lean();

  assertFound(
    courseModule,
    "Course module not found or unavailable",
    404
  );

  const actionFilter: QueryFilter<
    IModuleAction
  > = {
    module:
      new Types.ObjectId(moduleId),
  };

  if (!isPrivileged) {
    actionFilter.status =
      "published";
  } else {
    actionFilter.status = {
      $ne: "archived",
    };
  }

  const actions =
    await ModuleAction.find(
      actionFilter
    )
      .sort({ order: 1 })
      .populate(
        "createdBy",
        "fullName email role profileImage"
      )
      .populate(
        "updatedBy",
        "fullName email role profileImage"
      ).lean();

  return {
    module: courseModule,
    actions,
  };
};

const getSingleModuleAction = async (
  actionId: string,
  actorRole?: string | undefined
) => {
  assertValidObjectId(
    actionId,
    "Module action ID"
  );

  const filter: QueryFilter<
    IModuleAction
  > = {
    _id: actionId,
  };

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
  }

  const action =
    await ModuleAction.findOne(filter)
      .populate({
        path: "module",
        select:
          "title slug moduleNumber pillar status",

        populate: {
          path: "pillar",
          model: "ChallengePillar",
          select:
            "name slug title status",
        },
      })
      .populate(
        "createdBy",
        "fullName email role profileImage"
      )
      .populate(
        "updatedBy",
        "fullName email role profileImage"
      ).lean();

  assertFound(
    action,
    "Module action not found",
    404
  );

  return action;
};

const updateModuleAction = async (
  actionId: string,
  payload: IUpdateModuleAction,
  actorId: string
) => {
  assertValidObjectId(
    actionId,
    "Module action ID"
  );

  const action =
    await ModuleAction.findById(
      actionId
    );

  assertFound(
    action,
    "Module action not found",
    404
  );

  if (
    action.status === "archived"
  ) {
    throwServiceError(
      "Archived action cannot be updated",
      400
    );
  }

  if (
    payload.order !== undefined &&
    payload.order !== action.order
  ) {
    const duplicateAction =
      await ModuleAction.findOne({
        _id: {
          $ne: action._id,
        },

        module: action.module,

        order: payload.order,
      }).lean();

    if (duplicateAction) {
      throwServiceError(
        "Action order already exists in this module",
        409
      );
    }
  }

  if (
    payload.title !== undefined
  ) {
    action.title = payload.title;
  }

  if (
    payload.description === null
  ) {
    action.set(
      "description",
      undefined
    );
  } else if (
    payload.description !==
    undefined
  ) {
    action.description =
      payload.description;
  }

  if (
    payload.order !== undefined
  ) {
    action.order = payload.order;
  }

  if (
    payload.isRequired !== undefined
  ) {
    action.isRequired =
      payload.isRequired;
  }

  if (
    payload.pointsReward !==
    undefined
  ) {
    action.pointsReward =
      payload.pointsReward;
  }

  action.updatedBy =
    new Types.ObjectId(actorId);

  try {
    await action.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "Action order already exists in this module",
        409
      );
    }

    throw error;
  }

  return action.populate([
    {
      path: "module",
      select:
        "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",
        select:
          "name slug title status",
      },
    },
    {
      path: "updatedBy",
      select:
        "fullName email role profileImage",
    },
  ]);
};

const publishModuleAction = async (
  actionId: string,
  actorId: string
) => {
  assertValidObjectId(
    actionId,
    "Module action ID"
  );

  const action =
    await ModuleAction.findById(
      actionId
    );

  assertFound(
    action,
    "Module action not found",
    404
  );

  if (
    action.status === "archived"
  ) {
    throwServiceError(
      "Archived action cannot be published",
      400
    );
  }

  const courseModule =
    await CourseModule.findById(
      action.module
    ).lean();

  assertFound(
    courseModule,
    "Parent course module not found",
    404
  );

  if (
    courseModule.status !==
    "published"
  ) {
    throwServiceError(
      "Publish the parent course module before publishing this action",
      400
    );
  }

  action.status = "published";
  action.publishedAt =
    new Date();

  action.set(
    "archivedAt",
    undefined
  );

  action.updatedBy =
    new Types.ObjectId(actorId);

  await action.save();

  return action;
};

const moveModuleActionToDraft =
  async (
    actionId: string,
    actorId: string
  ) => {
    assertValidObjectId(
      actionId,
      "Module action ID"
    );

    const action =
      await ModuleAction.findById(
        actionId
      );

    assertFound(
      action,
      "Module action not found",
      404
    );

    if (
      action.status === "archived"
    ) {
      throwServiceError(
        "Archived action cannot be moved to draft",
        400
      );
    }

    action.status = "draft";

    action.set(
      "publishedAt",
      undefined
    );

    action.updatedBy =
      new Types.ObjectId(actorId);

    await action.save();

    return action;
  };

const archiveModuleAction = async (
  actionId: string,
  actorId: string
) => {
  assertValidObjectId(
    actionId,
    "Module action ID"
  );

  const action =
    await ModuleAction.findById(
      actionId
    );

  assertFound(
    action,
    "Module action not found",
    404
  );

  action.status = "archived";
  action.archivedAt =
    new Date();

  action.set(
    "publishedAt",
    undefined
  );

  action.updatedBy =
    new Types.ObjectId(actorId);

  await action.save();

  return action;
};

export const moduleActionService = {
  createModuleAction,

  getAllModuleActions,
  getActionsByModule,
  getSingleModuleAction,

  updateModuleAction,

  publishModuleAction,
  moveModuleActionToDraft,
  archiveModuleAction,
};