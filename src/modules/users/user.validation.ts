import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email is required' })
  .refine(
    (value) => {
      const normalized = value.toLowerCase();
      return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
        normalized
      );
    },
    { message: 'Please enter a valid email address' }
  )
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .trim()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(100, { message: 'Password must be at most 100 characters' });

export const registerValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,

    role: z.enum([
      'founder',
      'manager',
      'co_mentor',
      'super_admin',
      'admin',
      'associate',
      'partner',
      'ambassador',
      'ceo',
      'ceo_partner',
      'we_club_member',
    ]),
    accessTo: z.enum(['we_command_center', 'invictus', 'both']),
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
    discountCode: z.string().trim().optional(),
    membershipDurationMonths: z
      .union([z.literal(3), z.literal(6), z.literal(12)])
      .optional(),
  }),
});

export const loginValidation = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
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

export const createManagerByAdminValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),

    email: emailSchema,

    password: passwordSchema,

    role: z.enum(["manager"]),

    accessTo: z.enum([
      "we_command_center",
      "invictus",
      "both",
    ]),
  }),
});


export const createAdminAccountValidation = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,

    // ekhane sob possible creatable role rakhlam,
    // kon requester kon role banate parbe seta service e check hobe
    role: z.enum(["manager", "super_admin", "co_mentor"]),

    accessTo: z.enum(["we_command_center", "invictus", "both"]),
    
  }),
});