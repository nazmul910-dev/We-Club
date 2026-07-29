import { QueryFilter, Types } from "mongoose";

import { CourseModule } from "../courseModules/course.module.model.schema";
import { moduleProgressService } from "../moduleProgress/module.progress.service";


import {
  IQuizAttempt,
  IQuizAttemptAdminQuery,
  IQuizAttemptAnswer,
  ISubmitQuizAttempt,
} from "./quiz.attempt.interface";

import { QuizAttempt } from "./quiz.attempt.model.schema";
import { QuizQuestion } from "../quizeQuestions/quiz.question.model.schema";

const MAXIMUM_ATTEMPTS = 2;
const PASS_SCORE = 70;

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

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const normalizeIndexes = (indexes: number[]): number[] => {
  return [...indexes].sort((first, second) => first - second);
};

const arraysAreEqual = (first: number[], second: number[]): boolean => {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
};

const validateSelectedIndexes = (
  selectedIndexes: number[] ,
  optionCount: number,
): void => {
  const uniqueIndexes = new Set(selectedIndexes);

  if (uniqueIndexes.size !== selectedIndexes?.length) {
    throwServiceError("Selected option indexes must be unique", 400);
  }

  for (const index of selectedIndexes) {
    if (index < 0 || index >= optionCount) {
      throwServiceError(
        "Selected option index is outside the available options",
        400,
      );
    }
  }
};

const ensureModuleIsAvailable = async (moduleId: string) => {
  assertValidObjectId(moduleId, "Course module ID");

  const courseModule = await CourseModule.findById(moduleId).select(
    "_id pillar title slug moduleNumber status",
  );

  assertFound(courseModule, "Course module not found", 404);

  if (courseModule.status !== "published") {
    throwServiceError("Course module is not published", 403);
  }

  return courseModule;
};

const submitQuizAttempt = async (
  userId: string,
  moduleId: string,
  payload: ISubmitQuizAttempt,
) => {
  assertValidObjectId(userId, "User ID");

  await ensureModuleIsAvailable(moduleId);

  /**
   * Recalculate server-derived video totals
   * before checking quiz unlock.
   */
  const moduleProgress = await moduleProgressService.refreshModuleProgress(
    userId,
    moduleId,
  );

  if (!moduleProgress.quizUnlocked) {
    throwServiceError(
      "Quiz is locked. Complete the required videos, resources and at least 80% of required actions first",
      403,
    );
  }

  const previousAttempts = await QuizAttempt.find({
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),
  })
    .sort({
      attemptNumber: 1,
    })
    .select("attemptNumber score passed submittedAt")
    .lean();

  if (previousAttempts.some((attempt) => attempt.passed)) {
    throwServiceError("This quiz has already been passed", 409);
  }

  if (previousAttempts.length >= MAXIMUM_ATTEMPTS) {
    throwServiceError("Maximum two quiz attempts have already been used", 400);
  }

  const questions = await QuizQuestion.find({
    module: new Types.ObjectId(moduleId),

    status: "published",
  })
    .sort({
      order: 1,
    })
    .select(
      [
        "_id",
        "question",
        "questionType",
        "options",
        "correctOptionIndexes",
        "correctBooleanAnswer",
        "order",
      ].join(" "),
    )
    .lean();

  if (questions.length === 0) {
    throwServiceError("No published quiz questions are available", 400);
  }

  const answerMap = new Map(
    payload.answers.map((answer) => [answer.questionId, answer]),
  );

  if (answerMap.size !== payload.answers.length) {
    throwServiceError("A question cannot be answered more than once", 400);
  }

  if (payload.answers.length !== questions.length) {
    throwServiceError("Every published quiz question must be answered", 400);
  }

  const validQuestionIds = new Set(
    questions.map((question:any) => question._id.toString()),
  );

  for (const submittedAnswer of payload.answers) {
    if (!validQuestionIds.has(submittedAnswer.questionId)) {
      throwServiceError(
        "An answer references a question outside this module quiz",
        400,
      );
    }
  }

  const calculatedAnswers: IQuizAttemptAnswer[] = [];

  let correctAnswers = 0;

  for (const question of questions) {
    const questionId = question._id.toString();

    const submittedAnswer = answerMap.get(questionId);

    assertFound(submittedAnswer, "A required quiz answer is missing", 400);

    let isCorrect = false;

    const answerData: Record<string, unknown> = {
      question: question._id,
    };

    if (question.questionType === "true_false") {
      if (typeof submittedAnswer.booleanAnswer !== "boolean") {
        throwServiceError(
          `Question ${question.order} requires a boolean answer`,
          400,
        );
      }

      if (submittedAnswer.selectedOptionIndexes !== undefined) {
        throwServiceError(
          `Question ${question.order} does not accept option indexes`,
          400,
        );
      }

      if (typeof question.correctBooleanAnswer !== "boolean") {
        throwServiceError(
          `Question ${question.order} has an invalid answer configuration`,
          500,
        );
      }

      isCorrect =
        submittedAnswer.booleanAnswer === question.correctBooleanAnswer;

      answerData.booleanAnswer = submittedAnswer.booleanAnswer;
    } else {
      const selectedIndexes = submittedAnswer.selectedOptionIndexes;

      if (!selectedIndexes || selectedIndexes.length === 0) {
        throwServiceError(
          `Question ${question.order} requires selected option indexes`,
          400,
        );
      }

      if (submittedAnswer.booleanAnswer !== undefined) {
        throwServiceError( 
          `Question ${question.order} does not accept a boolean answer`,
          400,
        );
      }

      const options = question.options ? [...question.options] : [];

    //   if (options.length < 2) {
    //     throwServiceError(
    //       `Question ${question.order} has invalid options`,
    //       500,
    //     );
    //   }

      assertFound(selectedIndexes,
  `Question ${question.order} requires selected option indexes`,
  400,)

      validateSelectedIndexes(selectedIndexes, options.length);

      if (
        question.questionType === "single_choice" &&
        selectedIndexes?.length !== 1
      ) {
        throwServiceError(
          `Question ${question.order} requires exactly one selected option`,
          400,
        );
      }

      const correctIndexes = question.correctOptionIndexes
        ? [...question.correctOptionIndexes]
        : [];

      if (correctIndexes.length === 0) {
        throwServiceError(
          `Question ${question.order} has no configured correct answer`,
          500,
        );
      }

      isCorrect = arraysAreEqual(
        normalizeIndexes(selectedIndexes),

        normalizeIndexes(correctIndexes),
      );

      answerData.selectedOptionIndexes = selectedIndexes;
    }

    answerData.isCorrect = isCorrect;

    calculatedAnswers.push(answerData as unknown as IQuizAttemptAnswer);

    if (isCorrect) {
      correctAnswers += 1;
    }
  }

  const totalQuestions = questions.length;

  /**
   * Frontend score is never used.
   */
  const score = roundToTwoDecimals((correctAnswers / totalQuestions) * 100);

  const passed = score >= PASS_SCORE;

  const previousHighestAttempt = previousAttempts.reduce(
    (highest, attempt) => Math.max(highest, attempt.attemptNumber),
    0,
  );

  const attemptNumber = previousHighestAttempt + 1;

  const submittedAt = new Date();

  let attempt;

  try {
    attempt = await QuizAttempt.create({
      user: new Types.ObjectId(userId),

      module: new Types.ObjectId(moduleId),

      attemptNumber,

      answers: calculatedAnswers,

      totalQuestions,

      correctAnswers,

      score,

      passed,

      submittedAt,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A quiz attempt is already being processed. Please refresh before trying again",
        409,
      );
    }

    throw error;
  }

  const allAttempts = await QuizAttempt.find({
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),
  })
    .select("score passed submittedAt")
    .lean();

  const bestScore = allAttempts.reduce(
    (highestScore, item) => Math.max(highestScore, item.score),
    0,
  );

  const hasPassed = allAttempts.some((item) => item.passed);

  const latestAttemptAt = allAttempts.reduce<Date | undefined>(
    (latestDate, item) => {
      if (!latestDate) {
        return item.submittedAt;
      }

      return item.submittedAt > latestDate ? item.submittedAt : latestDate;
    },
    undefined,
  );

  await moduleProgressService.syncQuizSummary({
    userId,
    moduleId,

    attemptsUsed: allAttempts.length,

    bestScore,

    passed: hasPassed,

    ...(latestAttemptAt !== undefined
      ? {
          lastAttemptAt: latestAttemptAt,
        }
      : {}),
  });

  return attempt.populate([
    {
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name title slug status",
      },
    },

    {
      path: "answers.question",

      select: [
        "question",
        "questionType",
        "options",
        "explanation",
        "order",
      ].join(" "),
    },
  ]);
};

const getMyModuleAttempts = async (userId: string, moduleId: string) => {
  assertValidObjectId(userId, "User ID");

  assertValidObjectId(moduleId, "Course module ID");

  return QuizAttempt.find({
    user: new Types.ObjectId(userId),

    module: new Types.ObjectId(moduleId),
  })
    .sort({
      attemptNumber: 1,
    })
    .populate(
      "answers.question",
      ["question", "questionType", "options", "explanation", "order"].join(" "),
    );
};

const getMySingleAttempt = async (userId: string, attemptId: string) => {
  assertValidObjectId(userId, "User ID");

  assertValidObjectId(attemptId, "Quiz attempt ID");

  const filter: QueryFilter<IQuizAttempt> = {
    _id: new Types.ObjectId(attemptId),

    user: new Types.ObjectId(userId),
  };

  const attempt = await QuizAttempt.findOne(filter)
    .populate({
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name title slug status",
      },
    })
    .populate(
      "answers.question",
      ["question", "questionType", "options", "explanation", "order"].join(" "),
    );

  assertFound(attempt, "Quiz attempt not found", 404);

  return attempt;
};

const getSingleAttemptAdmin = async (attemptId: string) => {
  assertValidObjectId(attemptId, "Quiz attempt ID");

  const attempt = await QuizAttempt.findById(attemptId)
    .populate("user", "fullName email role profileImage")
    .populate({
      path: "module",

      select: "title slug moduleNumber pillar status",

      populate: {
        path: "pillar",
        model: "ChallengePillar",

        select: "name title slug status",
      },
    })
    .populate(
      "answers.question",
      [
        "question",
        "questionType",
        "options",
        "correctOptionIndexes",
        "correctBooleanAnswer",
        "explanation",
        "order",
      ].join(" "),
    );

  assertFound(attempt, "Quiz attempt not found", 404);

  return attempt;
};

const getAllQuizAttempts = async (query: IQuizAttemptAdminQuery) => {
  const filter: QueryFilter<IQuizAttempt> = {};

  if (query.userId) {
    assertValidObjectId(query.userId, "User ID");

    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.moduleId) {
    assertValidObjectId(query.moduleId, "Course module ID");

    filter.module = new Types.ObjectId(query.moduleId);
  }

  if (query.passed !== undefined) {
    filter.passed = query.passed;
  }

  const page = query.page ?? 1;

  const limit = query.limit ?? 20;

  const skip = (page - 1) * limit;

  const [attempts, total] = await Promise.all([
    QuizAttempt.find(filter)
      .sort({
        submittedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email role profileImage")
      .populate({
        path: "module",

        select: "title slug moduleNumber pillar status",

        populate: {
          path: "pillar",
          model: "ChallengePillar",

          select: "name title slug status",
        },
      }),

    QuizAttempt.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),
    },

    data: attempts,
  };
};

export const quizAttemptService = {
  submitQuizAttempt,

  getMyModuleAttempts,
  getMySingleAttempt,

  getSingleAttemptAdmin,
  getAllQuizAttempts,
};
