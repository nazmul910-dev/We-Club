import { z } from "zod";

import { QUIZ_QUESTION_TYPES } from "./quiz.question.interface";

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

const optionSchema = z
  .string()
  .trim()
  .min(1)
  .max(500);

const createQuizQuestionBodySchema =
  z
    .object({
      question: z
        .string()
        .trim()
        .min(2)
        .max(2000),

      questionType: z.enum(
        QUIZ_QUESTION_TYPES
      ),

      options: z
        .array(optionSchema)
        .min(2)
        .max(8)
        .optional(),

      correctOptionIndexes: z
        .array(
          z
            .number()
            .int()
            .nonnegative()
        )
        .min(1)
        .max(8)
        .optional(),

      correctBooleanAnswer: z
        .boolean()
        .optional(),

      explanation: z
        .string()
        .trim()
        .max(5000)
        .optional(),

      order: z
        .number()
        .int()
        .min(1),
    })
    .superRefine(
      (data, context) => {
        if (
          data.questionType ===
          "true_false"
        ) {
          if (
            typeof data
              .correctBooleanAnswer !==
            "boolean"
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              path: [
                "correctBooleanAnswer",
              ],

              message:
                "True/false question requires correctBooleanAnswer",
            });
          }

          return;
        }

        if (
          !data.options ||
          data.options.length < 2
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["options"],

            message:
              "Choice question requires at least two options",
          });
        }

        if (
          !data.correctOptionIndexes ||
          data.correctOptionIndexes
            .length === 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "correctOptionIndexes",
            ],

            message:
              "Choice question requires correct option indexes",
          });
        }

        if (
          data.questionType ===
            "single_choice" &&
          data.correctOptionIndexes &&
          data.correctOptionIndexes
            .length !== 1
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "correctOptionIndexes",
            ],

            message:
              "Single-choice question requires exactly one correct option",
          });
        }
      }
    );

const updateQuizQuestionBodySchema =
  z
    .object({
      question: z
        .string()
        .trim()
        .min(2)
        .max(2000)
        .optional(),

      questionType: z
        .enum(
          QUIZ_QUESTION_TYPES
        )
        .optional(),

      options: z
        .array(optionSchema)
        .min(2)
        .max(8)
        .nullable()
        .optional(),

      correctOptionIndexes: z
        .array(
          z
            .number()
            .int()
            .nonnegative()
        )
        .min(1)
        .max(8)
        .nullable()
        .optional(),

      correctBooleanAnswer: z
        .boolean()
        .nullable()
        .optional(),

      explanation: z
        .string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),

      order: z
        .number()
        .int()
        .min(1)
        .optional(),
    })
    .refine(
      (body) =>
        Object.keys(body).length > 0,
      {
        message:
          "At least one field is required",
      }
    );

export const createQuizQuestionValidation =
  z.object({
    params: z.object({
      moduleId: mongoObjectIdSchema,
    }),

    body:
      createQuizQuestionBodySchema,
  });

export const updateQuizQuestionValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),

    body:
      updateQuizQuestionBodySchema,
  });

export const quizQuestionIdValidation =
  z.object({
    params: z.object({
      id: mongoObjectIdSchema,
    }),
  });

export const quizQuestionModuleValidation =
  z.object({
    params: z.object({
      moduleId: mongoObjectIdSchema,
    }),
  });