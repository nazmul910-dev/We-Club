import { model, Schema } from "mongoose";

import {
  ISupportTicket,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
} from "./support.ticket.interface";

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true, trim: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: SUPPORT_TICKET_CATEGORIES, default: "general", required: true, index: true },
    priority: { type: String, enum: SUPPORT_TICKET_PRIORITIES, default: "medium", required: true, index: true },
    status: { type: String, enum: SUPPORT_TICKET_STATUSES, default: "open", required: true, index: true },
    adminResponse: { type: String, trim: true, maxlength: 5000 },
    respondedAt: Date,
    resolvedAt: Date,
  },
  { timestamps: true, collection: "supporttickets" },
);

supportTicketSchema.index({ requester: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);
