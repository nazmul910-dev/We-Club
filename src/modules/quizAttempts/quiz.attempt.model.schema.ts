import { model, Schema } from "mongoose";

import { IQuizAttempt, IQuizAttemptAnswer } from "./quiz.attempt.interface";

const quizAttemptAnswerSchema = new Schema<IQuizAttemptAnswer>(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
    },

    selectedOptionIndexes: {
      type: [
        {
          type: Number,
          min: 0,
        },
      ],

      default: undefined,
    },

    booleanAnswer: {
      type: Boolean,
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 2,
    },

    answers: {
      type: [quizAttemptAnswerSchema],
      required: true,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    passed: {
      type: Boolean,
      required: true,
      index: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "quizattempts",
  },
);

/**
 * Prevent duplicate attempt number.
 */
quizAttemptSchema.index(
  {
    user: 1,
    module: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  },
);

quizAttemptSchema.index({
  user: 1,
  module: 1,
  submittedAt: -1,
});

quizAttemptSchema.index({
  module: 1,
  passed: 1,
});

export const QuizAttempt = model<IQuizAttempt>(
  "QuizAttempt",
  quizAttemptSchema,
);
