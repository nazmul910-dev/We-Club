import { Types } from "mongoose";

export interface IQuizAttemptAnswer {
  question: Types.ObjectId;

  selectedOptionIndexes?: number[] | undefined;

  booleanAnswer?: boolean | undefined;

  isCorrect: boolean;
}

export interface IQuizAttempt {
  user: Types.ObjectId;
  module: Types.ObjectId;

  attemptNumber: number;

  answers: IQuizAttemptAnswer[];

  totalQuestions: number;
  correctAnswers: number;

  score: number;
  passed: boolean;

  submittedAt: Date;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ISubmitQuizAnswer {
  questionId: string;

  selectedOptionIndexes?: number[] | undefined;

  booleanAnswer?: boolean | undefined;
}

export interface ISubmitQuizAttempt {
  answers: ISubmitQuizAnswer[];
}

export interface IQuizAttemptAdminQuery {
  userId?: string | undefined;
  moduleId?: string | undefined;
  passed?: boolean | undefined;

  page?: number | undefined;
  limit?: number | undefined;
}
