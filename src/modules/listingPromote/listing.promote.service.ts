
import mongoose, { Types } from "mongoose";
import { IPromoteRequest } from "./listing.promote.interface";
import { Listing } from "../listings/listings.model.schema";
import { PromoteRequest } from "./listings.promote.request.model.schema";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "../listings/listings.interface";
import { NotFoundError, UnauthorizedError } from "../../utility/errorResponses";
import { createPendingCommissionFromPromotionApproval } from "../commissionLedger/commission.ledger.service";
import { UserRole } from "../users/user.interface";

/**
 * Service layer: owns all DB interaction + business logic for PromoteRequest.
 * Controllers should never talk to the model directly — always go through here.
 */

type AuthUser = {
  id: string;
  role: UserRole;
};

type ManagePromoteRequestPayload = {
  status: 'approved' | 'rejected';
  confirmed_commission_pct?: number | undefined;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const isAdminOrManager = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager';
};





const createPromoteRequestInDB = async (
    requesterId : string,
  payload: Partial<IPromoteRequest>
): Promise<IPromoteRequest> => {
  // Narrow + validate required fields up front — this also fixes the TS overload error,
  // since after these checks TS knows listing_id/requester_id are NOT undefined.
  if (!payload.listing_id || !requesterId) {
    throw new Error("listing_id and requester_id are required");
  }

  const listingId = payload.listing_id;

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
   const requestPayload = {
    requester_id : requesterId, ...payload
   }

  const promoteRequest = new PromoteRequest(requestPayload );
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

const deletePromoteRequest = async(id : string, role : string) => {

    if(role !== "admin") {
        throw new UnauthorizedError("Only admins can perform this action")
    }

  const promoteRequest = await PromoteRequest.findById(id);
 
  if (!promoteRequest) {
    throw new NotFoundError("Promote request not found");
  }
 
  promoteRequest.is_deleted = true;
  promoteRequest.deleted_at = new Date();
 
  return await promoteRequest.save();
}

const manageListingPromoteRequestInDB = async (
  promoteRequestId: string,  // the :id from params
  associateId: string,       // the user performing the action
  isAdmin: boolean,
  approved_by: string,       // role — rename for clarity if needed
  payload: { status: "approved" | "rejected"; confirmed_commission_pct?: number }
): Promise<IPromoteRequest> => {


  console.log(promoteRequestId)

  const promoteRequest = await PromoteRequest.findById(promoteRequestId);
  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }

  const listing = await Listing.findById(promoteRequest.listing_id  // prefer body value, fall back to stored one
  );
  

  if (!listing) {
    throw new Error("Related listing not found");
  }


  const isOwner = listing.associate_id.toString() === associateId.toString();


  console.log(isAdmin)

  if (!isOwner && !isAdmin) {
    throw new UnauthorizedError("You are not authorized to manage this promote request");
  }

  if (promoteRequest.status !== "pending") {
    throw new Error("This request has already been resolved");
  }

  promoteRequest.status = payload.status;

  console.log(typeof approved_by);


  if (payload.status === "approved") {

   
    promoteRequest.confirmed_commission_pct =
      payload.confirmed_commission_pct ?? promoteRequest.proposed_commission_pct;

    // ✅ Fixed: use promoteRequest._id as promotion_request_id
    //           use promoteRequest.promoter_id (who made the request) as promoter_id
    //           use associateId as approved_by (who approved it)
    await createPendingCommissionFromPromotionApproval({
      approved_by: associateId,                              // ✅ who approved
      listing_id: promoteRequest.listing_id.toString(),      // ✅ the listing
     promotion_request_id: promoteRequest._id.toString(),   // ✅ used to look up promoter internally
});

     console.log("heree" , promoteRequest.listing_id, promoteRequestId, approved_by, associateId)
  }



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
 
  promoteRequest.status = "cancelled"
 
  return await promoteRequest.save();
};

export const listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  manageListingPromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB,
deletePromoteRequest
  
};