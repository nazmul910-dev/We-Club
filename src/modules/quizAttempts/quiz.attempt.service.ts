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
        "updatedAt",
        "createdAt",
      ].join(" "),
    )
    .lean();

  if (questions.length === 0) {
    throwServiceError("No published quiz questions are available", 400);
  }

  const latestQuestionTime = questions.reduce<Date | undefined>((latest, q) => {
    const t = (q as any).updatedAt ?? (q as any).createdAt;
    return t && (!latest || t > latest) ? t : latest;
  }, undefined);

  // Filter previous attempts that were submitted at or after the latest question update
  const currentVersionAttempts = latestQuestionTime
    ? previousAttempts.filter(
        (a) => a.submittedAt && a.submittedAt >= latestQuestionTime,
      )
    : previousAttempts;

  if (currentVersionAttempts.some((attempt) => attempt.passed)) {
    const bestScore = currentVersionAttempts.reduce(
      (max, a) => Math.max(max, a.score ?? 0),
      0,
    );
    const lastAttempt =
      currentVersionAttempts[currentVersionAttempts.length - 1];
    await moduleProgressService.syncQuizSummary({
      userId,
      moduleId,
      attemptsUsed: currentVersionAttempts.length,
      bestScore,
      passed: true,
      lastAttemptAt: lastAttempt?.submittedAt,
    });
    throwServiceError("This quiz has already been passed", 409);
  }

  if (currentVersionAttempts.length >= MAXIMUM_ATTEMPTS) {
    throwServiceError("Maximum two quiz attempts have already been used", 400);
  }

  const answerMap = new Map(
    payload.answers.map((answer) => [answer.questionId, answer]),
  );

  if (answerMap.size !== payload.answers.length) {
    throwServiceError("A question cannot be answered more than once", 400);
  }

  // Map of questions already answered correctly in any previous passed attempt
  const previouslyPassedAttempts = previousAttempts.filter((a) => a.passed);
  const previouslyCorrectAnswersMap = new Map<string, any>();
  for (const a of previouslyPassedAttempts) {
    for (const ans of a.answers ?? []) {
      if (ans.isCorrect) {
        const qId = ans.question?._id
          ? ans.question._id.toString()
          : ans.question?.toString();
        if (qId) {
          previouslyCorrectAnswersMap.set(qId, ans);
        }
      }
    }
  }

  // Ensure every published question is either submitted or was previously passed
  for (const question of questions) {
    const qId = question._id.toString();
    const hasSubmitted = answerMap.has(qId);
    const wasPassed = previouslyCorrectAnswersMap.has(qId);
    if (!hasSubmitted && !wasPassed) {
      throwServiceError(
        `Question ${question.order} requires an answer`,
        400,
      );
    }
  }

  const validQuestionIds = new Set(
    questions.map((question: any) => question._id.toString()),
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
  const submittedQuestionIds = new Set<string>();

  let correctAnswers = 0;

  for (const question of questions) {
    const questionId = question._id.toString();
    const submittedAnswer = answerMap.get(questionId);

    if (submittedAnswer) {
      submittedQuestionIds.add(questionId);

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

        assertFound(
          selectedIndexes,
          `Question ${question.order} requires selected option indexes`,
          400,
        );

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
    } else {
      // Carry forward previously correct answer
      const prevAns = previouslyCorrectAnswersMap.get(questionId);
      assertFound(prevAns, "A required quiz answer is missing", 400);

      calculatedAnswers.push({
        question: question._id,
        selectedOptionIndexes: prevAns.selectedOptionIndexes,
        booleanAnswer: prevAns.booleanAnswer,
        isCorrect: true,
      });

      correctAnswers += 1;
    }
  }

  const totalQuestions = questions.length;

  /**
   * Frontend score is never used.
   */
  const score = roundToTwoDecimals((correctAnswers / totalQuestions) * 100);

  // All newly submitted questions must be correct to pass
  const newQuestionsAllCorrect =
    submittedQuestionIds.size === 0 ||
    calculatedAnswers
      .filter((a) => submittedQuestionIds.has(a.question.toString()))
      .every((a) => a.isCorrect);

  const passed = score >= PASS_SCORE && newQuestionsAllCorrect;

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

  await moduleProgressService.refreshModuleProgress(userId, moduleId);

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
