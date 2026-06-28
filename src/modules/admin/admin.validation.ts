import { z } from 'zod';
import { Types } from 'mongoose';
import {
  ACCOUNT_STATUSES,
  APPROVAL_STATUSES,
  LICENSE_VERIFICATION_STATUSES,
} from '../users/user.interface';

const mongoIdValidation = z
  .string()
  .refine((id) => Types.ObjectId.isValid(id), {
    message: 'Invalid user id',
  });

export const updateApprovalStatusValidation = z
  .object({
    params: z.object({
      id: mongoIdValidation,
    }),
    body: z.object({
      approvalStatus: z.enum(APPROVAL_STATUSES),
      rejectedReason: z.string().trim().max(500).optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.body.approvalStatus === 'rejected' &&
      !data.body.rejectedReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'rejectedReason'],
        message: 'Rejected reason is required when approval status is rejected',
      });
    }
  });

export const updateLicenseVerificationStatusValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    licenseVerificationStatus: z.enum(LICENSE_VERIFICATION_STATUSES),
  }),
});

export const updateAccountStatusValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    accountStatus: z.enum(ACCOUNT_STATUSES),
  }),
});