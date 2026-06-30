import { z } from 'zod';
import { Types } from 'mongoose';

const mongoIdValidation = z
  .string()
  .refine((id) => Types.ObjectId.isValid(id), {
    message: 'Invalid listing id',
  });

export const downloadListingAssetsValidation = z.object({
  params: z.object({
    listingId: mongoIdValidation,
  }),
});

export const listingAssetLogsValidation = z.object({
  params: z.object({
    listingId: mongoIdValidation,
  }),
});