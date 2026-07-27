import {
  model,
  Schema,
} from "mongoose";

import {
  IQuizQuestion,
  QUIZ_QUESTION_STATUSES,
  QUIZ_QUESTION_TYPES,
} from "./quiz.question.interface";

const quizQuestionSchema =
  new Schema<IQuizQuestion>(
    {
      module: {
        type: Schema.Types.ObjectId,
        ref: "CourseModule",
        required: true,
        index: true,
      },

      question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },

      questionType: {
        type: String,
        enum: QUIZ_QUESTION_TYPES,
        required: true,
      },

      options: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: undefined,
      },

      correctOptionIndexes: {
        type: [
          {
            type: Number,
            min: 0,
          },
        ],
        default: undefined,
      },

      correctBooleanAnswer: {
        type: Boolean,
      },

      explanation: {
        type: String,
        trim: true,
        maxlength: 5000,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      status: {
        type: String,
        enum: QUIZ_QUESTION_STATUSES,
        default: "draft",
        index: true,
      },

      publishedAt: {
        type: Date,
      },

      archivedAt: {
        type: Date,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      collection: "quizquestions",
    }
  );

quizQuestionSchema.index(
  {
    module: 1,
    order: 1,
  },
  {
    unique: true,
  }
);

quizQuestionSchema.index({
  module: 1,
  status: 1,
  order: 1,
});

export const QuizQuestion =
  model<IQuizQuestion>(
    "QuizQuestion",
    quizQuestionSchema
  );