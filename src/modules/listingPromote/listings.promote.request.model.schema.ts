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
    requester_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    is_deleted  : {
      type : Boolean,
      default : false
    },
    deleted_at : Date,
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
  },
  {
    timestamps: false, // we manage requested_at / resolved_at manually
  }
);

// Auto-exclude soft-deleted requests from every find-style query by default,
// same pattern as the Listing model.
PromoteRequestSchema.pre(/^find/, function (this: any) {
  if (this.getFilter().is_deleted === undefined) {
    this.where({ is_deleted: false });
  }
});

// Prevent the same user from spamming duplicate pending requests on the same listing
PromoteRequestSchema.index(
  { listing_id: 1, requester_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Common query patterns: "all requests for a listing", "all requests by a user"
PromoteRequestSchema.index({ listing_id: 1, status: 1 });
PromoteRequestSchema.index({ requester_id: 1 });

/**
 * Keep Listing.promoters in sync whenever a request resolves.
 * - approved  -> add requester_id to Listing.promoters
 * - rejected  -> remove requester_id from Listing.promoters (in case it was previously approved then reverted)
 */
PromoteRequestSchema.pre("save", function (this: IPromoteRequest) {
  if (this.isModified("status") && this.status !== "pending") {
    this.resolved_at = this.resolved_at ?? new Date();

    // below the code commentout by Nazmul without middle line that was already commentout

    // if (this.status === "approved" && this.confirmed_commission_pct == null) {
    //   // default: confirmed = whatever was proposed, unless associate explicitly overrides it
    //   this.confirmed_commission_pct = this.proposed_commission_pct;
    // }
  }
});

PromoteRequestSchema.post("save", async function (doc) {
  if (doc.status === "approved") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $addToSet: { promoters: doc.requester_id },
    });
  } else if (doc.status === "rejected") {
    await Listing.findByIdAndUpdate(doc.listing_id, {
      $pull: { promoters: doc.requester_id },
    });
  }
});

export const PromoteRequest = model<IPromoteRequest>(
  "PromoteRequest",
  PromoteRequestSchema
);