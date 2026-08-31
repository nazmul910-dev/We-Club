import { z } from "zod";

const mongoObjectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

export const createInvictusCheckoutValidation = z.object({
  body: z
    .object({
      paymentPlanId: mongoObjectIdSchema.optional(),
      pillarId: mongoObjectIdSchema.optional(),
      discountCode: z.string().trim().optional(),
    })
    .refine((data) => Boolean(data.paymentPlanId || data.pillarId), {
      message: "Either paymentPlanId or pillarId must be provided",
    }),
});
