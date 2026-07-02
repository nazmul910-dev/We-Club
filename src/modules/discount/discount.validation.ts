import { z } from 'zod';

export const createDiscountCodeValidation = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(50),
    discountPercent: z.number().min(1).max(100),

    allowedRoles: z
      .array(
        z.enum([
          'associate',
          'partner',
          'ambassador',
          'ceo',
          'ceo_partner',
          'we_club_member',
        ])
      )
      .optional(),

    allowedAccessTo: z
      .array(z.enum(['we_command_center', 'invictus', 'both']))
      .optional(),

    maxRedemptionsPerRole: z.number().int().positive().optional(),

    expiresAt: z.string().datetime().optional(),

    note: z.string().trim().max(500).optional(),
  }),
});

export const validateDiscountCodeValidation = z.object({
  query: z.object({
    code: z.string().trim().min(2).max(50),
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

export const sendDiscountCodeEmailValidation = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().trim().min(2).max(50),
  }),
});