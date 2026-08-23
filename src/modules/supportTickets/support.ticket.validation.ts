import { z } from "zod";

import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_PRIORITIES, SUPPORT_TICKET_STATUSES } from "./support.ticket.interface";

const id = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const createSupportTicketValidation = z.object({
  body: z.object({
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(5).max(5000),
    category: z.enum(SUPPORT_TICKET_CATEGORIES).default("general"),
    priority: z.enum(SUPPORT_TICKET_PRIORITIES).default("medium"),
  }),
});

export const supportTicketIdValidation = z.object({ params: z.object({ id }) });
export const supportTicketListValidation = z.object({
  query: z.object({
    status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
    priority: z.enum(SUPPORT_TICKET_PRIORITIES).optional(),
    category: z.enum(SUPPORT_TICKET_CATEGORIES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
export const updateSupportTicketValidation = z.object({
  params: z.object({ id }),
  body: z.object({
    status: z.enum(SUPPORT_TICKET_STATUSES),
    adminResponse: z.string().trim().max(5000).optional(),
    assignedTo: id.optional(),
  }),
});
