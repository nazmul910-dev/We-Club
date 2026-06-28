import { Schema, model } from 'mongoose';
import {
  COMMISSION_PAYMENT_METHODS,
  COMMISSION_STATUSES,
  ICommissionLedger,
  PLATFORM_FEE_STATUSES,
} from './commision.ledger.interface';

const CommissionStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      required: true,
    },
    changed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changed_at: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { _id: false }
);

const CommissionLedgerSchema = new Schema<ICommissionLedger>(
  {
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },

    promotion_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'PromoteRequest',
      index: true,
    },

    listing_owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    promoter_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      default: 'pending',
      index: true,
    },

    currency: {
      type: String,
      required: true,
      trim: true,
      default: 'USD',
    },

    listing_price_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    commission_rate_percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    estimated_commission_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    final_commission_amount: {
      type: Number,
      min: 0,
    },

    deal_closed_at: {
      type: Date,
    },

    payment_tracking: {
      marked_paid_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      marked_paid_at: {
        type: Date,
      },
      receiver_confirmed_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      receiver_confirmed_at: {
        type: Date,
      },
      payment_method: {
        type: String,
        enum: COMMISSION_PAYMENT_METHODS,
      },
      payment_reference: {
        type: String,
        trim: true,
        maxlength: 255,
      },
      note: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },

    dispute: {
      opened_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      opened_at: {
        type: Date,
      },
      reason: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      resolved_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      resolved_at: {
        type: Date,
      },
      resolution_note: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },

    platform_fee: {
      rate_percent: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 100,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: PLATFORM_FEE_STATUSES,
        default: 'not_required',
      },
      provider: {
        type: String,
        enum: ['stripe', 'helcim'],
      },
      provider_payment_id: {
        type: String,
        trim: true,
      },
      paid_at: {
        type: Date,
      },
    },

    status_history: {
      type: [CommissionStatusHistorySchema],
      default: [],
    },

    is_frozen: {
      type: Boolean,
      default: false,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

CommissionLedgerSchema.index(
  {
    promotion_request_id: 1,
    promoter_id: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      promotion_request_id: { $exists: true },
    },
  }
);

export const CommissionLedger = model<ICommissionLedger>(
  'CommissionLedger',
  CommissionLedgerSchema
);