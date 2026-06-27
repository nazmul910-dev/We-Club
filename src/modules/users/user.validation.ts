import { z } from 'zod';

export const registerValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(100),

    role: z.enum([
      'associate',
      'partner',
      'ambassador',
      'ceo',
      'ceo_partner',
      'we_club_member',
    ]),

    licenseNumber: z.string().trim().optional(),
    brokerage: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    bio: z.string().trim().max(1000).optional(),

    socialLinks: z
      .object({
        linkedin: z.string().url().optional(),
        instagram: z.string().url().optional(),
        website: z.string().url().optional(),
      })
      .optional(),

    marketingChannels: z.array(z.string()).optional(),
  }),
});

export const loginValidation = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8),
  }),
});

export const approveUserValidation = z.object({
  body: z.object({
    userId: z.string().min(1),
    durationDays: z.number().int().positive(),
  }),
});

export const rejectUserValidation = z.object({
  body: z.object({
    userId: z.string().min(1),
    reason: z.string().trim().min(2).max(500),
  }),
});