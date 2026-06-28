import { z } from 'zod';

export const SOCIAL_LINK_PLATFORMS = [
  'linkedin',
  'facebook',
  'twitter',
  'instagram',
  'website',
] as const;

export const updateBasicProfileValidation = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),

      brokerage: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(30).optional(),
      city: z.string().trim().max(100).optional(),
      country: z.string().trim().max(100).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

export const updateBioValidation = z.object({
  body: z
    .object({
      bio: z.string().trim().max(1000),
    })
    .strict(),
});

export const upsertSocialLinkValidation = z.object({
  body: z
    .object({
      platform: z.enum(SOCIAL_LINK_PLATFORMS),
      url: z.string().trim().url('Invalid social link URL').max(500),
    })
    .strict(),
});

export const deleteSocialLinkValidation = z.object({
  params: z.object({
    platform: z.enum(SOCIAL_LINK_PLATFORMS),
  }),
});

export const updateMarketingChannelsValidation = z.object({
  body: z
    .object({
      marketingChannels: z
        .array(z.string().trim().min(1).max(80))
        .max(20)
        .transform((channels) => [...new Set(channels)]),
    })
    .strict(),
});

export type UpdateBasicProfilePayload = z.infer<
  typeof updateBasicProfileValidation
>['body'];

export type UpdateBioPayload = z.infer<typeof updateBioValidation>['body'];

export type UpsertSocialLinkPayload = z.infer<
  typeof upsertSocialLinkValidation
>['body'];

export type UpdateMarketingChannelsPayload = z.infer<
  typeof updateMarketingChannelsValidation
>['body'];

export type SocialLinkPlatform = (typeof SOCIAL_LINK_PLATFORMS)[number];