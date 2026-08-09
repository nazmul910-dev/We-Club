import { z } from 'zod';

export const createUpgradeCheckoutValidation =
  z.object({
    body: z.object({
      durationMonths: z.union([
        z.literal(3),
        z.literal(6),
        z.literal(12),
      ]),

      discountCode: z
        .string()
        .trim()
        .max(50)
        .optional(),
    }),
  });

export const paymentRolePricingValidation = z.object({
  params: z.object({
    role: z.enum([
      'associate',
      'partner',
      'ambassador',
      'ceo',
      'ceo_partner',
      'we_club_member',
    ]),
    accessTo: z.enum(['we_command_center', 'invictus', 'both']), 
  }),
});

export const verifyCheckoutSessionValidation = z.object({
  params: z.object({
    sessionId: z.string().min(5),
  }),
});