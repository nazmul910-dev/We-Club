import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const MAX_HEARTBEAT_SEGMENT_SECONDS = 60;

export const recordVideoHeartbeatValidation = z.object({
  params: z.object({
    videoId: mongoObjectIdSchema,
  }),

  body: z
    .object({
      segmentStartSeconds: z.number().finite().nonnegative(),

      segmentEndSeconds: z.number().finite().positive(),

      currentPositionSeconds: z.number().finite().nonnegative(),
    })
    .superRefine((data, context) => {
      if (data.segmentEndSeconds <= data.segmentStartSeconds) {
        context.addIssue({
          code: z.ZodIssueCode.custom,

          path: ["segmentEndSeconds"],

          message: "Segment end must be greater than segment start",
        });
      }

      const segmentLength = data.segmentEndSeconds - data.segmentStartSeconds;

      if (segmentLength > MAX_HEARTBEAT_SEGMENT_SECONDS) {
        context.addIssue({
          code: z.ZodIssueCode.custom,

          path: ["segmentEndSeconds"],

          message: `A heartbeat segment cannot exceed ${MAX_HEARTBEAT_SEGMENT_SECONDS} seconds`,
        });
      }
    }),
});

export const videoProgressVideoIdValidation = z.object({
  params: z.object({
    videoId: mongoObjectIdSchema,
  }),
});

export const videoProgressModuleIdValidation = z.object({
  params: z.object({
    moduleId: mongoObjectIdSchema,
  }),
});

export const getAllVideoProgressValidation = z.object({
  query: z.object({
    userId: mongoObjectIdSchema.optional(),

    videoId: mongoObjectIdSchema.optional(),

    moduleId: mongoObjectIdSchema.optional(),

    isCompleted: z.enum(["true", "false"]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
