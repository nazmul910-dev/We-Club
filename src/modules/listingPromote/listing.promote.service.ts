import mongoose, { ClientSession, Types } from "mongoose";
import { IPromoteRequest } from "./listing.promote.interface";
import { Listing } from "../listings/listings.model.schema";
import { PromoteRequest } from "./listings.promote.request.model.schema";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "../listings/listings.interface";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../utility/errorResponses";
import {
  commissionLedgerService,
  createPendingCommissionFromPromotionApproval,
} from "../commissionLedger/commission.ledger.service";
import { UserRole } from "../users/user.interface";
import { User } from "../users/users.model.schema";
import { sendPromotionApprovalEmail } from "./listing.promotion.approval.email";
import { Promoter } from "../promoters/promoters.model.schema";


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
    PromoteRequest.find().populate("listing_id", "title ref_code cover_image").populate(
      "requester.user_id",
      "fullName email profileImage licenseNumber phone country city role"
    ),
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
    ).populate(
  "requester.user_id",
  "fullName email profileImage licenseNumber phone country city role"
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


    if (promoteRequest.status !== "pending") {
      throwError("Only pending promote requests can be managed", 400);
    }


    const isOwner = isSameId(listing?.associate_id, authUser.id);
    const isAdmin = isAdminOrManager(authUser.role as UserRole);

    if (!isOwner && !isAdmin) {
      throwError("You are not authorized to manage this promote request", 403);
    }



    promoteRequest.status = payload.status;
    promoteRequest.resolved_at = new Date();

    if (payload.status === "approved") {
      promoteRequest.selected_tier = payload.selected_tier
        ? payload.selected_tier
        : "tier_1";
    }

    await promoteRequest.save({ session });



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

const getPublicPromoteRequestDetailsFromDB = async (id: string) => {
  const promoteRequest = await PromoteRequest.findById(id)
    .populate({
      path: "listing_id",
      select:
        "title ref_code cover_image images price location bedrooms bathrooms area_sqm referral_commission status",
      populate: {
        path: "associate_id",
        select:
          "fullName email phone licenseNumber brokerage profileImage city country bio socialLinks role",
      },
    })
    .populate({
      path: "requester.user_id",
      select:
        "fullName email phone licenseNumber brokerage profileImage city country bio socialLinks role",
    })
    .lean();
 
  if (!promoteRequest) {
    throw new NotFoundError("This link is invalid or no longer exists");
  }
 
  const safeRequest = promoteRequest as any;
 
  if (safeRequest.status !== "approved") {
    throw new BadRequestError(
      "This promotion request has not been approved yet"
    );
  }
 
  if (!safeRequest.selected_tier) {
    throw new BadRequestError("This request has no tier assigned yet");
  }
 
  const listing = safeRequest.listing_id;
  const owner = listing?.associate_id;
  const promoter = safeRequest.requester?.user_id;
 
  return {
    id: safeRequest._id,
    status: safeRequest.status,
    selected_tier: safeRequest.selected_tier,
    requested_at: safeRequest.requested_at,
    resolved_at: safeRequest.resolved_at,
    proposed_commission_pct: safeRequest.proposed_commission_pct,
    confirmed_commission_pct: safeRequest.confirmed_commission_pct,
 
    listing: listing
      ? {
          id: listing._id,
          title: listing.title,
          ref_code: listing.ref_code,
          status: listing.status,
          cover_image: listing.cover_image,
          images: listing.images,
          price: listing.price,
          location: listing.location,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area_sqm: listing.area_sqm,
          referral_commission: listing.referral_commission,
        }
      : null,
 
    listing_owner: owner
      ? {
          fullName: owner.fullName,
          email: owner.email,
          phone: owner.phone,
          licenseNumber: owner.licenseNumber,
          brokerage: owner.brokerage,
          profileImage: owner.profileImage,
          city: owner.city,
          country: owner.country,
          bio: owner.bio,
          socialLinks: owner.socialLinks,
          role: owner.role,
        }
      : null,
 
    promoter: promoter
      ? {
          fullName: promoter.fullName,
          email: promoter.email,
          phone: promoter.phone,
          licenseNumber: promoter.licenseNumber,
          brokerage: promoter.brokerage,
          profileImage: promoter.profileImage,
          city: promoter.city,
          country: promoter.country,
          bio: promoter.bio,
          socialLinks: promoter.socialLinks,
          role: promoter.role,
        }
      : { email: safeRequest.requester?.email },
  };
};

export const listingPromoteRequestService = {
  createPromoteRequestInDB,
  getAllListingPromoteRequest,
  getMyListingsPromoteRequestFromDB,
  managePromoteRequestInDB,
  getMyPromoteRequestsFromDB,
  cancelPromoteRequestInDB,
  deletePromoteRequest,
  getPublicPromoteRequestDetailsFromDB,
};
