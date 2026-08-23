import { Types } from "mongoose";

import assertFound from "../../utility/assertFound";
import { BadRequestError } from "../../utility/errorResponses";
import { User } from "../users/users.model.schema";

import { ISupportTicketListQuery } from "./support.ticket.interface";
import { SupportTicket } from "./support.ticket.model.schema";

const populate = [
  { path: "requester", select: "fullName email role" },
  { path: "assignedTo", select: "fullName email role" },
];

const ticketNumber = () => `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const list = async (filter: Record<string, unknown>, query: ISupportTicketListQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const [data, total] = await Promise.all([
    SupportTicket.find(filter).populate(populate).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SupportTicket.countDocuments(filter),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const supportTicketService = {
  async create(requester: string, payload: Record<string, unknown>) {
    const user = await User.findById(requester).select("_id");
    assertFound(user, "Requester user not found", 404);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await SupportTicket.create({ ...payload, requester: new Types.ObjectId(requester), ticketNumber: ticketNumber() });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    throw new BadRequestError("Could not generate a unique ticket number");
  },
  myTickets(requester: string, query: ISupportTicketListQuery) {
    return list({ requester: new Types.ObjectId(requester), ...queryFilters(query) }, query);
  },
  adminList(query: ISupportTicketListQuery) { return list(queryFilters(query), query); },
  async getById(id: string, requester: string, isAdmin: boolean) {
    const filter = isAdmin ? { _id: id } : { _id: id, requester };
    const ticket = await SupportTicket.findOne(filter).populate(populate);
    assertFound(ticket, "Support ticket not found", 404);
    return ticket;
  },
  async update(id: string, adminId: string, payload: { status: string; adminResponse?: string; assignedTo?: string }) {
    if (payload.assignedTo) {
      const assignee = await User.findById(payload.assignedTo).select("_id");
      assertFound(assignee, "Assigned user not found", 404);
    }
    const update: Record<string, unknown> = { status: payload.status };
    if (payload.adminResponse !== undefined) { update.adminResponse = payload.adminResponse; update.respondedAt = new Date(); }
    if (payload.assignedTo) update.assignedTo = new Types.ObjectId(payload.assignedTo);
    if (payload.status === "resolved" || payload.status === "closed") update.resolvedAt = new Date();
    const ticket = await SupportTicket.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate(populate);
    assertFound(ticket, "Support ticket not found", 404);
    return ticket;
  },
};

const queryFilters = (query: ISupportTicketListQuery) => {
  const { page: _page, limit: _limit, ...filters } = query;
  return filters;
};
