import { Types } from "mongoose";

export const SUPPORT_TICKET_CATEGORIES = [
  "general",
  "technical",
  "billing",
  "membership",
  "account",
] as const;

export const SUPPORT_TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const SUPPORT_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export interface ISupportTicket {
  ticketNumber: string;
  requester: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  adminResponse?: string;
  respondedAt?: Date;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupportTicketListQuery {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  page?: number;
  limit?: number;
}
