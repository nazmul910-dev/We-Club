
import { Types } from "mongoose";
import { IPromoteRequest } from "./listing.promote.interface";
import { Listing } from "../listings/listings.model.schema";
import { PromoteRequest } from "./listings.promote.request.model.schema";
import QueryBuilder from "../../utility/queryBuilder";

/**
 * Service layer: owns all DB interaction + business logic for PromoteRequest.
 * Controllers should never talk to the model directly — always go through here.
 */

const createPromoteRequestInDB = async (
  payload: Partial<IPromoteRequest>
): Promise<IPromoteRequest> => {
  // Narrow + validate required fields up front — this also fixes the TS overload error,
  // since after these checks TS knows listing_id/requester_id are NOT undefined.
  if (!payload.listing_id || !payload.requester_id) {
    throw new Error("listing_id and requester_id are required");
  }

  const listingId = payload.listing_id;
  const requesterId = payload.requester_id;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }

  const existingPending = await PromoteRequest.findOne({
    listing_id: listingId,
    requester_id: requesterId,
    status: "pending",
  });

  if (existingPending) {
    throw new Error("You already have a pending request for this listing");
  }

  const promoteRequest = new PromoteRequest(payload);
  return await promoteRequest.save();
};

const getAllListingPromoteRequest = async (
  query: Record<string, unknown>
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };

  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find()
      .populate("listing_id", "title ref_code cover_image")
      .populate("requester_id", "name email"),
    queryWithDefaultSort
  )
    .search(["message"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();

  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();

  return { data, meta };
};

const getMyListingsPromoteRequestFromDB = async (
  associateId: string,
  query: Record<string, unknown>
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  // 1. Find every listing this associate owns, but only pull the _id field —
  //    we don't need anything else from Listing here.
  const myListingIds = await Listing.find({ associate_id: associateId }).distinct("_id");
 
  // 2. If they own zero listings, short-circuit — no point even querying PromoteRequest.
  if (myListingIds.length === 0) {
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPage: 0 } };
  }
 
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };
 
  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find({ listing_id: { $in: myListingIds } })
      .populate("listing_id", "title ref_code cover_image")
      .populate("requester_id", "name email"),
    queryWithDefaultSort
  )
    .search(["message"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();
 
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
 
  return { data, meta };
};

const getMyPromoteRequestsFromDB = async (
  requesterId: string,
  query: Record<string, unknown>
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };
 
  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find({ requester_id: requesterId })
      .populate("listing_id", "title ref_code cover_image price"),
    queryWithDefaultSort
  )
    .search(["message"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();
 
  const data = await promoteRequestQuery.modelQuery;
  const meta = await promoteRequestQuery.countTotal();
 
  return { data, meta };
};

const manageListingPromoteRequestInDB = async (
  requestId: string,
  associateId: string,
  payload: { status: "approved" | "rejected"; confirmed_commission_pct?: number }
): Promise<IPromoteRequest> => {
  const promoteRequest = await PromoteRequest.findById(requestId);
 
  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }
 
  // listing_id is populated here, so we can read associate_id directly off it.
  // Cast through unknown since populate() changes the runtime shape but not the static type.
const listing = await Listing.findById(promoteRequest.listing_id);
 
    if (!listing) {
    throw new Error("Related listing not found");
  }

   if (listing.associate_id.toString() !== associateId.toString()) {
    throw new Error("You are not authorized to manage this promote request");
   }
 
  if (promoteRequest.status !== "pending") {
    throw new Error("This request has already been resolved");
  }
 
  promoteRequest.status = payload.status;
 
  if (payload.status === "approved") {
    // Associate can either accept the proposed commission as-is, or counter with their own.
    promoteRequest.confirmed_commission_pct =
      payload.confirmed_commission_pct ?? promoteRequest.proposed_commission_pct;
  }
 
  // .save() (not findByIdAndUpdate) so the pre/post "save" hooks actually fire
  // — that's what syncs Listing.promoters and sets resolved_at.
  return await promoteRequest.save();
};

const cancelPromoteRequestInDB = async (
  requestId: string,
  requesterId: string
): Promise<IPromoteRequest> => {
  const promoteRequest = await PromoteRequest.findById(requestId);
 
  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }
 
  if (promoteRequest.requester_id.toString() !== requesterId.toString()) {
    throw new Error("You are not authorized to cancel this request");
  }
 
  if (promoteRequest.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }
 
  await PromoteRequest.findByIdAndDelete(requestId);
 
  return promoteRequest;
};

export const listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  manageListingPromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB
};