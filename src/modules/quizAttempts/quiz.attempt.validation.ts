import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const quizAnswerSchema = z
  .object({
    questionId: mongoObjectIdSchema,

    selectedOptionIndexes: z
      .array(z.number().int().nonnegative())
      .min(1)
      .max(8)
      .optional(),

    booleanAnswer: z.boolean().optional(),
  })
  .strict()
  .superRefine((answer, context) => {
    const hasChoiceAnswer = answer.selectedOptionIndexes !== undefined;

    const hasBooleanAnswer = answer.booleanAnswer !== undefined;

    if (!hasChoiceAnswer && !hasBooleanAnswer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        message: "An answer value is required",
      });
    }

    if (hasChoiceAnswer && hasBooleanAnswer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        message:
          "Provide either selectedOptionIndexes or booleanAnswer, not both",
      });
    }
  });

export const submitQuizAttemptValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),

  body: z
    .object({
      answers: z.array(quizAnswerSchema).min(1).max(5),
    })
    /**
     * score, passed বা attemptNumber
     * frontend থেকে পাঠালে reject হবে।
     */
    .strict(),
});

export const quizAttemptIdValidation = z.object({
  params: z.object({
    attemptId: mongoObjectIdSchema,
  }),
});

export const quizAttemptModuleValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
});

export const adminQuizAttemptIdValidation = z.object({
  params: z.object({
    id: mongoObjectIdSchema,
  }),
});

export const getAllQuizAttemptsValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),

    moduleId: mongoObjectIdSchema.optional(),

    passed: z.enum(["true", "false"]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
