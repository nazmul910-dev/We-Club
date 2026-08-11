import { z } from 'zod';
import { Types } from 'mongoose';
import {
  COMMISSION_PAYMENT_METHODS,
  COMMISSION_STATUSES,
} from './commision.ledger.interface';

const mongoIdValidation = z
  .string()
  .refine((id) => Types.ObjectId.isValid(id), {
    message: 'Invalid id',
  });

export const commissionIdValidation = z.object({
  params: z.object({
    id: mongoIdValidation, 
  }),
});

export const createManualCommissionValidation = z.object({
  body: z.object({
    listing_id: mongoIdValidation,
    promoter_id: mongoIdValidation,
    final_commission_amount: z.number().min(0).optional(),
    note: z.string().trim().max(1000).optional(),
  }),
});

export const confirmCommissionValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    // final_commission_amount: z.number().min(0),
    final_commission_pct: z.number().min(0).max(100),
    deal_closed_at: z.string().datetime().optional(),
    note: z.string().trim().max(1000).optional(),
  }),
});

export const markCommissionPaidValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    payment_method: z.enum(COMMISSION_PAYMENT_METHODS).optional(),
    payment_reference: z.string().trim().max(255).optional(),
    note: z.string().trim().max(1000).optional(),
  }),
});

export const confirmCommissionReceivedValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    
    note: z.string().trim().max(1000).optional(),
  }),
});

export const disputeCommissionValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    reason: z.string().trim().min(5).max(1000),
  }),
});

export const resolveDisputeValidation = z.object({
  params: z.object({
    id: mongoIdValidation,
  }),
  body: z.object({
    final_status: z.enum(COMMISSION_STATUSES).refine(
      (status) => status !== 'disputed',
      {
        message: 'Final status cannot be disputed',
      }
    ),
    resolution_note: z.string().trim().min(5).max(1000),
  }),
});

export const sendCommissionPaymentValidation =
  z.object({
    params: z.object({
      id: z.string().min(1),
    }),

    body: z.object({
      payment_method: z.enum([
        'bank_transfer',
        'stripe',
        'helcim',
        'cash',
        'check',
        'other',
      ]),

      payment_reference: z
        .string()
        .optional(),

      note: z
        .string()
        .optional(),
    }),
  });