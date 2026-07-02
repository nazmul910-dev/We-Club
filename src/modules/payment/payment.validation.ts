import { z } from 'zod';

export const createUpgradeCheckoutValidation = z.object({
  body: z.object({
    discountCode: z.string().trim().max(50).optional(),
  }).optional(),
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