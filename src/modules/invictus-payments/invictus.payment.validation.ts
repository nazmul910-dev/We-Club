import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

export const createInvictusCheckoutValidation =
  z.object({
    body: z.object({
      paymentPlanId:
        mongoObjectIdSchema,

      discountCode: z
        .string()
        .trim()
        .optional(),
    }),
  });
