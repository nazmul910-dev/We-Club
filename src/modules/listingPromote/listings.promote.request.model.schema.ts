import { Schema, model, Types, Document } from "mongoose";
import { Listing } from "../listings/listings.model.schema";
import { IPromoteRequest } from "./listing.promote.interface";

const PromoteRequestSchema = new Schema<IPromoteRequest>(
  {
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    requester: {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
      },

      email: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "owner_approved",
        "approved",
        "rejected",
        "promoter_rejected",
        "cancelled",
      ],
      default: "pending",
    },
    promoter_agreement_status: {
      type: String,
      enum: ["not_started", "pending", "accepted", "rejected"],
      default: "not_started",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    proposed_commission_pct: {
      type: Number,
      // required: true,
      min: 0,
      max: 100,
    },
    confirmed_commission_pct: {
      type: Number,
      min: 0,
      max: 100,
    },
    marketing_channels: {
      type: [String],
      default: [],
    },
    message: {
      type: String,
      trim: true,
    },
    promoter_rejection_reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    promoter_rejected_at: {
  type: Date,
},
    selected_tier: {
      type: String,
      enum: ["tier_1", "tier_2", "tier_3"],
      default: null,
    },
    deleted_at: Date,
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
  },

  {
    timestamps: false,
  },
);

PromoteRequestSchema.pre(/^find/, function (this: any) {
  if (this.getFilter().is_deleted === undefined) {
    this.where({ is_deleted: false });
  }
});

PromoteRequestSchema.index(
  { listing_id: 1, "requester.user_id": 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);
PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ "requester.user_id": 1 });

PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ "requester.user_id": 1 });

PromoteRequestSchema.pre("save", function (this: IPromoteRequest) {
  if (this.isModified("status") && this.status !== "pending") {
    this.resolved_at = this.resolved_at ?? new Date();
  }
});

export const PromoteRequest = model<IPromoteRequest>(
  "PromoteRequest",
  PromoteRequestSchema,
);
