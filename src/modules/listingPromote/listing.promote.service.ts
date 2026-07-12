import mongoose, { ClientSession, Types } from "mongoose";
import { IPromoteRequest } from "./listing.promote.interface";
import { Listing } from "../listings/listings.model.schema";
import { PromoteRequest } from "./listings.promote.request.model.schema";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "../listings/listings.interface";
import { NotFoundError, UnauthorizedError } from "../../utility/errorResponses";
import {
  commissionLedgerService,
  createPendingCommissionFromPromotionApproval,
} from "../commissionLedger/commission.ledger.service";
import { UserRole } from "../users/user.interface";
import { User } from "../users/users.model.schema";
import { sendPromotionApprovalEmail } from "./listing.promotion.approval.email";
import { Promoter } from "../promoters/promoters.model.schema";

/**
 * Service layer: owns all DB interaction + business logic for PromoteRequest.
 * Controllers should never talk to the model directly — always go through here.
 */

type AuthUser = {
  id: string;
  role: UserRole;
};

type ManagePromoteRequestPayload = {
  status: "approved" | "rejected";
  confirmed_commission_pct?: number | undefined;
  selected_tier?: "tier_1" | "tier_2" | "tier_3";
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const isAdminOrManager = (role: UserRole): boolean => {
  return role === "admin" || role === "manager";
};

const createPromoteRequestInDB = async (
  requesterId: string,
  payload: Partial<IPromoteRequest>,
): Promise<IPromoteRequest> => {
  if (!payload.listing_id || !requesterId) {
    throw new Error("listing_id and requester_id are required");


  }



  const listing = await Listing.findById(payload.listing_id);
  if (!listing) throw new Error("Listing not found");

  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }

  const existingRequest = await PromoteRequest.findOne({
    listing_id: payload.listing_id,
    "requester.user_id": requesterId, // ← was "requester._id"
    status: { $in: ["pending", "approved"] },
  });

  if (existingRequest) {
    const statusMessages: Record<string, string> = {
      pending: "You already have a pending request for this listing",
      approved: "You are already an approved promoter for this listing",
    };
    throw new Error(
      statusMessages[existingRequest.status] ??
        "You have an active request for this listing",
    );
  }
  // ← requester আর rebuild করছি না, payload-এ already আছে
  const promoteRequest = new PromoteRequest(payload);
  return await promoteRequest.save();
};

const getAllListingPromoteRequest = async (
  query: Record<string, unknown>,
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };

  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find().populate("listing_id", "title ref_code cover_image"),
    // no populate on requester — email is already embedded
    queryWithDefaultSort,
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
  query: Record<string, unknown>,
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  // 1. Find every listing this associate owns, but only pull the _id field —
  //    we don't need anything else from Listing here.
  const myListingIds = await Listing.find({
    associate_id: associateId,
  }).distinct("_id");

  // 2. If they own zero listings, short-circuit — no point even querying PromoteRequest.
  if (myListingIds.length === 0) {
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPage: 0 } };
  }

  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };

  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find({ listing_id: { $in: myListingIds } }).populate(
      "listing_id",
      "title ref_code cover_image",
    ),
    queryWithDefaultSort,
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
  query: Record<string, unknown>,
): Promise<{
  data: IPromoteRequest[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };

  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find({
      "requester.user_id": requesterId,
      is_deleted: { $ne: true },
    }).populate("listing_id", "title ref_code cover_image price"),
    queryWithDefaultSort,
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

const deletePromoteRequest = async (id: string, role: string) => {
  if (role !== "admin") {
    throw new UnauthorizedError("Only admins can perform this action");
  }

  const promoteRequest = await PromoteRequest.findById(id);

  if (!promoteRequest) {
    throw new NotFoundError("Promote request not found");
  }

  promoteRequest.is_deleted = true;
  promoteRequest.deleted_at = new Date();

  return await promoteRequest.save();
};

// const manageListingPromoteRequestInDB = async (
//   promoteRequestId: string,
//   userId: string,
//   isAdmin: boolean,
//   approved_by: string,

//   payload: {
//     status: "approved" | "rejected";
//     confirmed_commission_pct?: number;
//     selected_tier?: "tier_1" | "tier_2" | "tier_3";
//   },
// ): Promise<IPromoteRequest> => {
//   const promoteRequest = await PromoteRequest.findById(promoteRequestId);
//   if (!promoteRequest) throw new Error("Promote request not found");

//   // Fetch listing in parallel with nothing yet, but as soon as we have listing_id
//   const listing = await Listing.findById(promoteRequest.listing_id);
//   if (!listing) throw new Error("Related listing not found");

//   const isOwner = listing.associate_id.toString() === userId.toString();
//   if (!isOwner && !isAdmin) {
//     throw new UnauthorizedError(
//       "You are not authorized to manage this promote request",
//     );
//   }

//   if (promoteRequest.status !== "pending") {
//     throw new Error("This request has already been resolved");
//   }

//   promoteRequest.status = payload.status;

//   if (payload.status === "approved") {
//     if (!payload.selected_tier) {
//       throw new Error(
//         "selected_tier is required when approving a promote request",
//       );
//     }

//     promoteRequest.selected_tier = payload.selected_tier;
//     promoteRequest.confirmed_commission_pct =
//       payload.confirmed_commission_pct ??
//       promoteRequest.proposed_commission_pct;

//     // Run commission creation and save in parallel — they don't depend on each other
//     await Promise.all([
//       createPendingCommissionFromPromotionApproval({
//         approved_by: userId,
//         listing_id: promoteRequest.listing_id.toString(),
//         promotion_request_id: promoteRequest._id.toString(),
//         promoteRequest,
//         listing,
//       }),
//       promoteRequest.save(),
//     ]);

//     // Fire and forget — don't await, user shouldn't wait for SMTP
//     sendPromotionApprovalEmail({
//       toEmail: promoteRequest.requester.email,
//       promoterName: promoteRequest.requester.email.split("@")[0] || "Promoter",
//       listingTitle: listing.title,
//       listingId: listing._id.toString(),
//       tier: promoteRequest.selected_tier!,
//       confirmedCommissionPct: promoteRequest.confirmed_commission_pct!,
//     }).catch((err) =>
//       console.error("Promotion approval email failed silently:", err),
//     );

//     return promoteRequest;
//   }

//   // For rejection — just save
//   await promoteRequest.save();
//   return promoteRequest;
// };

const isSameId = (idA: unknown, idB: string): boolean =>
  String(idA) === String(idB);

const managePromoteRequestInDB = async (
  promoteRequestId: string,
  authUser: AuthUser,
  payload: {
    status: "approved" | "rejected";
    confirmed_commission_pct?: number;
    selected_tier?: "tier_1" | "tier_2" | "tier_3";
  },
): Promise<IPromoteRequest> => {
  const session: ClientSession = await mongoose.startSession();

  try {
    session.startTransaction();

    const promoteRequest = await PromoteRequest.findById(promoteRequestId).session(session);
    if (!promoteRequest) throw new Error("Promote request not found");

    // Fetch listing in parallel with nothing yet, but as soon as we have listing_id
    const listing = await Listing.findById(promoteRequest.listing_id).session(session);
    if (!listing) throw new Error("Related listing not found");

    // -------------------------
    // Get Promotion Request
    // -------------------------

    // const promoteRequest = await PromoteRequest.findById(requestId).session(
    //   session
    // );

    // if (promoteRequest === null) {
    //   throwError("Promote request not found", 404);
    // }

    if (promoteRequest.status !== "pending") {
      throwError("Only pending promote requests can be managed", 400);
    }

    // // -------------------------
    // // Get Listing
    // // -------------------------

    // const listing = await Listing.findById(promoteRequest?.listing_id).session(
    //   session
    // );

    // -------------------------
    // Authorization
    // -------------------------

    const isOwner = isSameId(listing?.associate_id, authUser.id);
    const isAdmin = isAdminOrManager(authUser.role as UserRole);

    if (!isOwner && !isAdmin) {
      throwError("You are not authorized to manage this promote request", 403);
    }

    // if (isSameId(promoteRequest.requester.user_id, authUser.id)) {
    //   throwError("You cannot manage your own promote request", 403);
    // }

    // -------------------------
    // Update Request
    // -------------------------

    promoteRequest.status = payload.status;
    promoteRequest.resolved_at = new Date();

    if (payload.status === "approved") {
      promoteRequest.selected_tier = payload.selected_tier
        ? payload.selected_tier
        : "tier_1";
    }

    await promoteRequest.save({ session });

    // -------------------------
    // Approval
    // -------------------------

    if (payload.status === "approved") {
      await Listing.findByIdAndUpdate(
        listing._id,
        {
          $addToSet: {
            promoters: {
              user_id: promoteRequest.requester.user_id,
              tier: promoteRequest.selected_tier,
            },
          },
        },
        { session },
      );

      // const promoteUser  = await User.findById()

      // Keep normalized copy in Promoter collection
      await Promoter.findOneAndUpdate(
        {
          user_id: promoteRequest.requester.user_id,
        },
        {
          $setOnInsert: {
            user_id: promoteRequest.requester.user_id,
            user : promoteRequest.requester.user_id,
          },

          $push: {
            listings: {
              listing_id: listing._id,
              listing_title: listing.title,
              listing_price:  listing.price.amount,
              listing_owner_id: listing.associate_id,
              promotion_request_id: promoteRequest._id,
              tier: promoteRequest.selected_tier,
              approved_by: authUser.id,
              approved_at: new Date(),
              status: "active",
            },
          },
        },
        {
          upsert: true,
          new: true,
          session,
          runValidators: true,
        },
      );
      await commissionLedgerService.createPendingCommissionFromPromotionApproval(
        {
          listing_id: listing._id.toString(),
          promotion_request_id: promoteRequest._id.toString(),
          approved_by: authUser.id,
          promoteRequest,
          listing,
          session,
        },
      );
    }

    // -------------------------
    // Rejection 
    // -------------------------

    if (payload.status === "rejected") {
      await Listing.findByIdAndUpdate(
        listing._id,
        {
          $pull: {
            promoters: {
              user_id: promoteRequest.requester.user_id,
              user : promoteRequest.requester.user_id
            },
          },
        },
        { session },
      );
    }

    await session.commitTransaction();

    return promoteRequest;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const cancelPromoteRequestInDB = async (
  requestId: string,
  requesterId: string,
): Promise<IPromoteRequest> => {
  const promoteRequest = await PromoteRequest.findById(requestId);

  if (!promoteRequest) {
    throw new Error("Promote request not found");
  }

  if (promoteRequest.requester.user_id.toString() !== requesterId.toString()) {
    // ← was promoteRequest.requester._id
    throw new Error("You are not authorized to cancel this request");
  }

  if (promoteRequest.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }

  promoteRequest.status = "cancelled";

  return await promoteRequest.save();
};

export const listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  managePromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB,
  deletePromoteRequest,
};
