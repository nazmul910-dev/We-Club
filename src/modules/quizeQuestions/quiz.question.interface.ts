import { Types } from "mongoose";

export const QUIZ_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "true_false",
] as const;

export const QUIZ_QUESTION_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type QuizQuestionType =
  (typeof QUIZ_QUESTION_TYPES)[number];

export type QuizQuestionStatus =
  (typeof QUIZ_QUESTION_STATUSES)[number];

export interface IQuizQuestion {
  module: Types.ObjectId;

  question: string;

  questionType: QuizQuestionType;

  options?: string[] | undefined;

  correctOptionIndexes?:
    | number[]
    | undefined;

  correctBooleanAnswer?:
    | boolean
    | undefined;

  explanation?: string | undefined;

  order: number;

  status: QuizQuestionStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateQuizQuestion {
  question: string;

  questionType: QuizQuestionType;

  options?: string[] | undefined;

  correctOptionIndexes?:
    | number[]
    | undefined;

  correctBooleanAnswer?:
    | boolean
    | undefined;

  explanation?: string | undefined;

  order: number;
}

export interface IUpdateQuizQuestion {
  question?: string | undefined;

  questionType?:
    | QuizQuestionType
    | undefined;

  options?:
    | string[]
    | null
    | undefined;

  correctOptionIndexes?:
    | number[]
    | null
    | undefined;

  correctBooleanAnswer?:
    | boolean
    | null
    | undefined;

  explanation?:
    | string
    | null
    | undefined;

  order?: number | undefined;
}