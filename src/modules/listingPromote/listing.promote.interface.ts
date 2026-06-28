import { Schema, model, Types, Document } from "mongoose";

export type PromoteReqStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface IPromoteRequest extends Document {
  listing_id: Types.ObjectId;
  requester_id: Types.ObjectId;
  proposed_commission_pct: number;
  confirmed_commission_pct?: number;
  marketing_channels: string[];
  message?: string;
  status: PromoteReqStatus;
  is_deleted : Boolean;
  deleted_at? : Date;
  requested_at: Date;
  resolved_at?: Date;

}