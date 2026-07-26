import {
  QueryFilter,
  Types,
} from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";

import {
  ICreateQuizQuestion,
  IQuizQuestion,
  IUpdateQuizQuestion,
  QuizQuestionType,
} from "./quiz.question.interface";

import { QuizQuestion } from "./quiz.question.model.schema";

const MAX_QUESTIONS_PER_MODULE = 5;

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

type QuestionConfiguration = {
  questionType: QuizQuestionType;

  options?: string[] | undefined;

  correctOptionIndexes?:
    | number[]
    | undefined;

  correctBooleanAnswer?:
    | boolean
    | undefined;
};

const validateQuestionConfiguration = ({
  questionType,
  options,
  correctOptionIndexes,
  correctBooleanAnswer,
}: QuestionConfiguration): void => {
  if (questionType === "true_false") {
    if (typeof correctBooleanAnswer !== "boolean") {
      return throwServiceError(
        "True/false question requires correctBooleanAnswer",
        400
      );
    }
    return;
  }

  if (!options || options.length < 2) {
    return throwServiceError(
      "Choice question requires at least two options",
      400
    );
  }

  if (!correctOptionIndexes || correctOptionIndexes.length === 0) {
    return throwServiceError(
      "Choice question requires correct option indexes",
      400
    );
  }

  const normalizedOptions = options.map((option) =>
    option.trim().toLowerCase()
  );

  if (new Set(normalizedOptions).size !== options.length) {
    return throwServiceError(
      "Quiz question options must be unique",
      400
    );
  }

  const uniqueCorrectIndexes = new Set(correctOptionIndexes);

  if (uniqueCorrectIndexes.size !== correctOptionIndexes.length) {
    return throwServiceError(
      "Correct option indexes must be unique",
      400
    );
  }

  for (const index of correctOptionIndexes) {
    if (index < 0 || index >= options.length) {
      return throwServiceError(
        "Correct option index is outside the available options",
        400
      );
    }
  }

  if (
    questionType === "single_choice" &&
    correctOptionIndexes.length !== 1
  ) {
    return throwServiceError(
      "Single-choice question requires exactly one correct option",
      400
    );
  }
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
        "Cannot manage quiz questions under an archived module",
        400
      );
    }

    return courseModule;
  };

const createQuizQuestion = async (
  moduleId: string,
  payload: ICreateQuizQuestion,
  actorId: string
) => {
  await ensureCourseModuleExists(
    moduleId
  );

  validateQuestionConfiguration({
    questionType:
      payload.questionType,

    options: payload.options,

    correctOptionIndexes:
      payload.correctOptionIndexes,

    correctBooleanAnswer:
      payload.correctBooleanAnswer,
  });

  const activeQuestionCount =
    await QuizQuestion.countDocuments({
      module: moduleId,

      status: {
        $ne: "archived",
      },
    });

  if (
    activeQuestionCount >=
    MAX_QUESTIONS_PER_MODULE
  ) {
    throwServiceError(
      `A module can contain a maximum of ${MAX_QUESTIONS_PER_MODULE} active quiz questions`,
      400
    );
  }

  const existingQuestion =
    await QuizQuestion.findOne({
      module: moduleId,
      order: payload.order,
    });

  if (existingQuestion) {
    throwServiceError(
      "Question order already exists in this module",
      409
    );
  }

  const createData: Record<
    string,
    unknown
  > = {
    module:
      new Types.ObjectId(moduleId),

    question: payload.question,

    questionType:
      payload.questionType,

    order: payload.order,

    status: "draft",

    createdBy:
      new Types.ObjectId(actorId),
  };

  if (
    payload.questionType ===
    "true_false"
  ) {
    createData.correctBooleanAnswer =
      payload.correctBooleanAnswer;
  } else {
    createData.options =
      payload.options;

    createData.correctOptionIndexes =
      payload.correctOptionIndexes;
  }

  if (
    payload.explanation !== undefined
  ) {
    createData.explanation =
      payload.explanation;
  }

  try {
    const question =
      await QuizQuestion.create(
        createData
      );

    return question.populate([
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
        "Question order already exists in this module",
        409
      );
    }

    throw error;
  }
};

const getAllQuizQuestions = async ({
  actorRole,
  moduleId,
  includeArchived = false,
}: {
  actorRole?: string | undefined;
  moduleId?: string | undefined;
  includeArchived?: boolean | undefined;
}) => {
  const filter: QueryFilter<
    IQuizQuestion
  > = {};

  if (moduleId) {
    assertValidObjectId(
      moduleId,
      "Course module ID"
    );

    filter.module =
      new Types.ObjectId(moduleId);
  }

  const isPrivileged =
    isAdminOrManager(actorRole);

  if (!isPrivileged) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived",
    };
  }

  const query =
    QuizQuestion.find(filter)
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
      );

  if (!isPrivileged) {
    query.select(
      [
        "-correctOptionIndexes",
        "-correctBooleanAnswer",
        "-explanation",
      ].join(" ")
    );
  }

  return query;
};

const getQuestionsByModule = async (
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
    );

  assertFound(
    courseModule,
    "Course module not found or unavailable",
    404
  );

  const questionFilter: QueryFilter<
    IQuizQuestion
  > = {
    module:
      new Types.ObjectId(moduleId),
  };

  if (!isPrivileged) {
    questionFilter.status =
      "published";
  } else {
    questionFilter.status = {
      $ne: "archived",
    };
  }

  const query =
    QuizQuestion.find(
      questionFilter
    )
      .sort({ order: 1 })
      .populate(
        "createdBy",
        "fullName email role profileImage"
      )
      .populate(
        "updatedBy",
        "fullName email role profileImage"
      );

  if (!isPrivileged) {
    query.select(
      [
        "-correctOptionIndexes",
        "-correctBooleanAnswer",
        "-explanation",
      ].join(" ")
    );
  }

  const questions = await query;

  return {
    module: courseModule,
    questions,
  };
};

const getSingleQuizQuestion =
  async (
    questionId: string,
    actorRole?: string | undefined
  ) => {
    assertValidObjectId(
      questionId,
      "Quiz question ID"
    );

    const filter: QueryFilter<
      IQuizQuestion
    > = {
      _id: questionId,
    };

    const isPrivileged =
      isAdminOrManager(actorRole);

    if (!isPrivileged) {
      filter.status = "published";
    }

    const query =
      QuizQuestion.findOne(filter)
        .populate({
          path: "module",
          select:
            "title slug moduleNumber pillar status",

          populate: {
            path: "pillar",
            model:
              "ChallengePillar",
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
        );

    if (!isPrivileged) {
      query.select(
        [
          "-correctOptionIndexes",
          "-correctBooleanAnswer",
          "-explanation",
        ].join(" ")
      );
    }

    const question =
      await query;

    assertFound(
      question,
      "Quiz question not found",
      404
    );

    return question;
  };

const updateQuizQuestion = async (
  questionId: string,
  payload: IUpdateQuizQuestion,
  actorId: string
) => {
  assertValidObjectId(
    questionId,
    "Quiz question ID"
  );

  const question =
    await QuizQuestion.findById(
      questionId
    );

  assertFound(
    question,
    "Quiz question not found",
    404
  );

  if (
    question.status ===
    "archived"
  ) {
    throwServiceError(
      "Archived question cannot be updated",
      400
    );
  }

  if (
    payload.order !== undefined &&
    payload.order !== question.order
  ) {
    const duplicateQuestion =
      await QuizQuestion.findOne({
        _id: {
          $ne: question._id,
        },

        module:
          question.module,

        order: payload.order,
      });

    if (duplicateQuestion) {
      throwServiceError(
        "Question order already exists in this module",
        409
      );
    }
  }

  const nextQuestionType =
    payload.questionType ??
    question.questionType;

  let nextOptions:
    | string[]
    | undefined;

  if (payload.options === null) {
    nextOptions = undefined;
  } else if (
    payload.options !== undefined
  ) {
    nextOptions =
      payload.options;
  } else {
    nextOptions =
      question.options
        ? [...question.options]
        : undefined;
  }

  let nextCorrectOptionIndexes:
    | number[]
    | undefined;

  if (
    payload.correctOptionIndexes ===
    null
  ) {
    nextCorrectOptionIndexes =
      undefined;
  } else if (
    payload.correctOptionIndexes !==
    undefined
  ) {
    nextCorrectOptionIndexes =
      payload.correctOptionIndexes;
  } else {
    nextCorrectOptionIndexes =
      question
        .correctOptionIndexes
        ? [
            ...question
              .correctOptionIndexes,
          ]
        : undefined;
  }

  let nextCorrectBooleanAnswer:
    | boolean
    | undefined;

  if (
    payload.correctBooleanAnswer ===
    null
  ) {
    nextCorrectBooleanAnswer =
      undefined;
  } else if (
    payload.correctBooleanAnswer !==
    undefined
  ) {
    nextCorrectBooleanAnswer =
      payload.correctBooleanAnswer;
  } else {
    nextCorrectBooleanAnswer =
      question
        .correctBooleanAnswer;
  }

  if (
    nextQuestionType ===
    "true_false"
  ) {
    nextOptions = undefined;

    nextCorrectOptionIndexes =
      undefined;
  } else {
    nextCorrectBooleanAnswer =
      undefined;
  }

  validateQuestionConfiguration({
    questionType:
      nextQuestionType,

    options: nextOptions,

    correctOptionIndexes:
      nextCorrectOptionIndexes,

    correctBooleanAnswer:
      nextCorrectBooleanAnswer,
  });

  if (
    payload.question !== undefined
  ) {
    question.question =
      payload.question;
  }

  question.questionType =
    nextQuestionType;

  question.set(
    "options",
    nextOptions
  );

  question.set(
    "correctOptionIndexes",
    nextCorrectOptionIndexes
  );

  question.set(
    "correctBooleanAnswer",
    nextCorrectBooleanAnswer
  );

  if (
    payload.explanation === null
  ) {
    question.set(
      "explanation",
      undefined
    );
  } else if (
    payload.explanation !==
    undefined
  ) {
    question.explanation =
      payload.explanation;
  }

  if (
    payload.order !== undefined
  ) {
    question.order =
      payload.order;
  }

  question.updatedBy =
    new Types.ObjectId(actorId);

  try {
    await question.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "Question order already exists in this module",
        409
      );
    }

    throw error;
  }

  return question.populate([
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

const publishQuizQuestion = async (
  questionId: string,
  actorId: string
) => {
  assertValidObjectId(
    questionId,
    "Quiz question ID"
  );

  const question =
    await QuizQuestion.findById(
      questionId
    );

  assertFound(
    question,
    "Quiz question not found",
    404
  );

  if (
    question.status ===
    "archived"
  ) {
    throwServiceError(
      "Archived question cannot be published",
      400
    );
  }

  validateQuestionConfiguration({
    questionType:
      question.questionType,

    options: question.options
      ? [...question.options]
      : undefined,

    correctOptionIndexes:
      question.correctOptionIndexes
        ? [
            ...question
              .correctOptionIndexes,
          ]
        : undefined,

    correctBooleanAnswer:
      question
        .correctBooleanAnswer,
  });

  const courseModule =
    await CourseModule.findById(
      question.module
    );

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
      "Publish the parent course module before publishing this question",
      400
    );
  }

  question.status =
    "published";

  question.publishedAt =
    new Date();

  question.set(
    "archivedAt",
    undefined
  );

  question.updatedBy =
    new Types.ObjectId(actorId);

  await question.save();

  return question;
};

const moveQuizQuestionToDraft =
  async (
    questionId: string,
    actorId: string
  ) => {
    assertValidObjectId(
      questionId,
      "Quiz question ID"
    );

    const question =
      await QuizQuestion.findById(
        questionId
      );

    assertFound(
      question,
      "Quiz question not found",
      404
    );

    if (
      question.status ===
      "archived"
    ) {
      throwServiceError(
        "Archived question cannot be moved to draft",
        400
      );
    }

    question.status = "draft";

    question.set(
      "publishedAt",
      undefined
    );

    question.updatedBy =
      new Types.ObjectId(actorId);

    await question.save();

    return question;
  };

const archiveQuizQuestion = async (
  questionId: string,
  actorId: string
) => {
  assertValidObjectId(
    questionId,
    "Quiz question ID"
  );

  const question =
    await QuizQuestion.findById(
      questionId
    );

  assertFound(
    question,
    "Quiz question not found",
    404
  );

  question.status = "archived";

  question.archivedAt =
    new Date();

  question.set(
    "publishedAt",
    undefined
  );

  question.updatedBy =
    new Types.ObjectId(actorId);

  await question.save();

  return question;
};

export const quizQuestionService = {
  createQuizQuestion,

  getAllQuizQuestions,
  getQuestionsByModule,
  getSingleQuizQuestion,

  updateQuizQuestion,

  publishQuizQuestion,
  moveQuizQuestionToDraft,
  archiveQuizQuestion,
};