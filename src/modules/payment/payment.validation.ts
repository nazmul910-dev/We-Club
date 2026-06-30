import { z } from 'zod';

export const createUpgradeCheckoutValidation = z.object({
  body: z.object({}).optional(),
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
  }),
});

export const verifyCheckoutSessionValidation = z.object({
  params: z.object({
    sessionId: z.string().min(5),
  }),
});