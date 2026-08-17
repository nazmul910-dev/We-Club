import { model, Schema } from "mongoose";

import {
  IRetreatBatch,
  RETREAT_BATCH_STATUSES,
} from "./retreat.batch.interface";

const retreatBatchSchema = new Schema<IRetreatBatch>(
  {
    retreatLocation: {
      type: Schema.Types.ObjectId,
      ref: "RetreatLocation",
      required: true,
      index: true,
    },

    batchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    confirmedBookingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    waitlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    depositAmount: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: RETREAT_BATCH_STATUSES,
      default: "upcoming",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    bookingDeadline: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "retreatbatches",
  },
);

retreatBatchSchema.index({
  retreatLocation: 1,
  status: 1,
});

retreatBatchSchema.index({
  startDate: 1,
  endDate: 1,
});

export const RetreatBatch = model<IRetreatBatch>(
  "RetreatBatch",
  retreatBatchSchema,
);
