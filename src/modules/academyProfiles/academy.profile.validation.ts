import { z } from "zod";

const createAcademyProfileValidation = z.object({
  body: z.object({
    academyName: z.string().max(100).optional(),

    bio: z.string().max(1000).optional(),

    experienceLevel: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),

    goals: z.array(z.string()).optional(),

    notificationPreferences: z
      .object({
        email: z.boolean().optional(),

        push: z.boolean().optional(),

        sms: z.boolean().optional(),
      })
      .optional(),
  }),
});

const updateAcademyProfileValidation = createAcademyProfileValidation;

export const AcademyProfileValidations = {
  createAcademyProfileValidation,

  updateAcademyProfileValidation,
};
