import mongoose, { ClientSession, Types } from "mongoose";
import { IPromoteRequest } from "./listing.promote.interface";
import { Listing } from "../listings/listings.model.schema";
import { PromoteRequest } from "./listings.promote.request.model.schema";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "../listings/listings.interface";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../utility/errorResponses";
import {
  commissionLedgerService,
  createPendingCommissionFromPromotionApproval,
} from "../commissionLedger/commission.ledger.service";
import { UserRole } from "../users/user.interface";
import { User } from "../users/users.model.schema";
import { sendPromotionApprovalEmail } from "./listing.promotion.approval.email";
import { Promoter } from "../promoters/promoters.model.schema";
import config from "../../config";

type AuthUser = {
  id: string;
  role: UserRole;
};

type RespondToOwnerTermsPayload = {
  decision: "accepted" | "rejected";
  promoter_website_url?: string;
  marketing_document_url?: string;
  rejection_reason?: string;
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

const validateOptionalUrl = (
  value: unknown,
  fieldName: string,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${fieldName} must be a valid URL`);
  }

  try {
    return new URL(value).toString();
  } catch {
    throw new BadRequestError(`${fieldName} must be a valid URL`);
  }
};

const buildPromotionAccessUrl = (requestId: string): string => {
  const frontendUrl = String(config.FRONTEND_URL).replace(/\/+$/, "");

  return `${frontendUrl}/promote-request/public/${requestId}`;
};

const isAdminOrManager = (role: UserRole): boolean => {
  return role === "admin" || role === "manager";
};

type AcceptOwnerTermsPayload = {
  accepted: boolean;
  promoter_website_url?: string;
  marketing_document_url?: string;
};

// const acceptOwnerTermsInDB = async (
//   promoteRequestId: string ,
//   requesterId: string,
//   payload: AcceptOwnerTermsPayload,
// ): Promise<IPromoteRequest> => {
//   if (payload.accepted !== true) {
//     throw new BadRequestError(
//       "You must accept the listing owner's terms",
//     );
//   }

//   const promoterWebsiteUrl = validateOptionalUrl(
//     payload.promoter_website_url,
//     "promoter_website_url",
//   );

//   const marketingDocumentUrl = validateOptionalUrl(
//     payload.marketing_document_url,
//     "marketing_document_url",
//   );

//   const session = await mongoose.startSession();

//   let completedRequest: IPromoteRequest | null = null;

//   let emailPayload:
//     | {
//         toEmail: string;
//         promoterName: string;
//         listingTitle: string;
//         listingId: string;
//         tier: "tier_1" | "tier_2" | "tier_3";
//         confirmedCommissionPct: number;
//         accessUrl: string;
//         promoterWebsiteUrl?: string;
//         marketingDocumentUrl?: string;
//       }
//     | null = null;

//   try {
//     session.startTransaction();

//     const promoteRequest = await PromoteRequest.findById(
//       promoteRequestId,
//     ).session(session);

//     if (!promoteRequest) {
//       throw new NotFoundError("Promote request not found");
//     }

//     if (
//       String(promoteRequest.requester.user_id) !== String(requesterId)
//     ) {
//       throw new UnauthorizedError(
//         "Only the promoter who submitted this request can accept the terms",
//       );
//     }

//     if (promoteRequest.status !== "owner_approved") {
//       throw new BadRequestError(
//         "The listing owner has not approved this request, or it has already been accepted",
//       );
//     }

//     if (promoteRequest.promoter_agreement_status !== "pending") {
//       throw new BadRequestError(
//         "This promotion agreement is not awaiting acceptance",
//       );
//     }

//     if (!promoteRequest.selected_tier) {
//       throw new BadRequestError(
//         "No promotion tier has been assigned",
//       );
//     }

//     const listing = await Listing.findById(
//       promoteRequest.listing_id,
//     ).session(session);

//     if (!listing) {
//       throw new NotFoundError("Related listing not found");
//     }

//     const promoterUser = await User.findById(
//       promoteRequest.requester.user_id,
//     )
//       .select("fullName email")
//       .session(session);

//     const accessUrl = buildPromotionAccessUrl(
//       promoteRequest._id.toString(),
//       promoteRequest.selected_tier,
//     );

//     promoteRequest.status = "approved";
//     promoteRequest.promoter_agreement_status = "accepted";
//     promoteRequest.promoter_accepted_at = new Date();
//     promoteRequest.resolved_at = new Date();

//     promoteRequest.promoter_website_url = promoterWebsiteUrl;
//     promoteRequest.marketing_document_url = marketingDocumentUrl;
//     promoteRequest.access_url = accessUrl;

//     await promoteRequest.save({ session });

//     await Listing.findByIdAndUpdate(
//       listing._id,
//       {
//         $addToSet: {
//           promoters: {
//             user_id: promoteRequest.requester.user_id,
//             tier: promoteRequest.selected_tier,
//           },
//         },
//       },
//       {
//         session,
//         runValidators: true,
//       },
//     );

//     const existingPromoterListing = await Promoter.findOne({
//       user_id: promoteRequest.requester.user_id,
//       "listings.promotion_request_id": promoteRequest._id,
//     }).session(session);

//     if (!existingPromoterListing) {
//       await Promoter.findOneAndUpdate(
//         {
//           user_id: promoteRequest.requester.user_id,
//         },
//         {
//           $setOnInsert: {
//             user_id: promoteRequest.requester.user_id,
//             user: promoteRequest.requester.user_id,
//           },

//           $push: {
//             listings: {
//               listing_id: listing._id,
//               listing_title: listing.title,
//               listing_price: listing.price?.amount ?? 0,
//               listing_owner_id: listing.associate_id,
//               promotion_request_id: promoteRequest._id,
//               tier: promoteRequest.selected_tier,
//               approved_by: listing.associate_id,
//               approved_at:
//                 promoteRequest.owner_approved_at ?? new Date(),
//               promoter_accepted_at: new Date(),
//               promoter_website_url: promoterWebsiteUrl,
//               marketing_document_url: marketingDocumentUrl,
//               access_url: accessUrl,
//               status: "active",
//             },
//           },
//         },
//         {
//           upsert: true,
//           new: true,
//           session,
//           runValidators: true,
//         },
//       );
//     }

//     await commissionLedgerService.createPendingCommissionFromPromotionApproval(
//       {
//         listing_id: listing._id.toString(),
//         promotion_request_id: promoteRequest._id.toString(),
//         approved_by: listing.associate_id.toString(),
//         promoteRequest,
//         listing,
//         session,
//       },
//     );

//     emailPayload = {
//       toEmail:
//         promoterUser?.email ?? promoteRequest.requester.email,

//       promoterName:
//         promoterUser?.fullName ?? "Promoter",

//       listingTitle: listing.title,

//       listingId: listing._id.toString(),

//       tier: promoteRequest.selected_tier,

//       confirmedCommissionPct:
//         promoteRequest.confirmed_commission_pct ?? 0,

//       accessUrl,

//       ...(promoterWebsiteUrl !== undefined
//         ? { promoterWebsiteUrl }
//         : {}),

//       ...(marketingDocumentUrl !== undefined
//         ? { marketingDocumentUrl }
//         : {}),
//     };

//     completedRequest = promoteRequest;

//     await session.commitTransaction();
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     await session.endSession();
//   }

//   if (emailPayload) {
//     try {
//       await sendPromotionApprovalEmail(emailPayload);
//     } catch (error) {
//       console.error(
//         "Promotion approval email failed:",
//         error,
//       );
//     }
//   }

//   if (!completedRequest) {
//     throw new Error("Unable to complete promotion acceptance");
//   }

//   return completedRequest;
// };

const createPromoteRequestInDB = async (
  requesterId: string,
  payload: Partial<IPromoteRequest>,
): Promise<IPromoteRequest> => {
  if (!payload.listing_id || !requesterId) {
    throw new Error("listing_id and requester_id are required");
  }

  const listing = await Listing.findById(payload.listing_id);
  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.associate_id.toString() === requesterId.toString()) {
    throw new Error("You cannot request to promote your own listing");
  }

  const existingRequest = await PromoteRequest.findOne({
    listing_id: payload.listing_id,
    "requester.user_id": requesterId,
    status: {
      $in: ["pending", "owner_approved", "approved", "promoter_rejected"],
    },
  });

  if (existingRequest) {
    const statusMessages: Record<string, string> = {
      pending: "You already have a pending promote request for this listing",
      owner_approved:
        "The listing owner has approved your request. Please accept or reject the terms.",
      approved: "You are already an approved promoter for this listing",
      promoter_rejected:
        "You previously rejected the listing owner's terms. You cannot submit another promotion request for this listing.",
    };

    throw new BadRequestError(
      statusMessages[existingRequest.status] ??
        "You already have an active request for this listing",
    );
  }

  const promoteRequest = new PromoteRequest({
    listing_id: payload.listing_id,
    requester: {
      user_id: requesterId,
      email: payload.requester?.email ?? "",
    },
    proposed_commission_pct: payload.proposed_commission_pct ?? 0,
    marketing_channels: payload.marketing_channels ?? [],
    message: payload.message ?? "",
    status: "pending",
    promoter_agreement_status: "not_started",
    selected_tier: null,
  });

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
    PromoteRequest.find()
      .populate(
        "listing_id",
        "title ref_code cover_image price referral_commission",
      )
      .populate(
        "requester.user_id",
        "fullName email profileImage licenseNumber phone country city role bio",
      ).lean(),
    // no populate on requester — email is already embedded
    queryWithDefaultSort,
  )
    .search(["message"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit()
    ;

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
    PromoteRequest.find({ listing_id: { $in: myListingIds } })
      .populate(
        "listing_id",
        "title ref_code cover_image price referral_commission location.city location.region location.country",
      )
      .populate(
        "requester.user_id",
        "fullName email profileImage licenseNumber phone country city role bio",
      ).lean(),
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
  data: Record<string, unknown>[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}> => {
  const queryWithDefaultSort = {
    sort: "-requested_at",
    ...query,
  };

  const promoteRequestQuery = new QueryBuilder<IPromoteRequest>(
    PromoteRequest.find({
      "requester.user_id": requesterId,
      is_deleted: { $ne: true },
    })
      .populate(
        "listing_id",
        "title ref_code cover_image price referral_commission",
      )
      .populate(
        "requester.user_id",
        "fullName email profileImage licenseNumber phone country city role bio",
      ).lean(),
    queryWithDefaultSort,
  )
    .search(["message"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();

  const documents = await promoteRequestQuery.modelQuery;

  const meta = await promoteRequestQuery.countTotal();

  const data = documents.map((document: any) => {
    const item =
      typeof document.toObject === "function" ? document.toObject() : document;

    const requesterUserId =
      item.requester?.user_id?._id ?? item.requester?.user_id;

    const isOriginalRequester = String(requesterUserId) === String(requesterId);

    const awaitingDecision =
      item.status === "owner_approved" &&
      item.promoter_agreement_status === "pending";

    return {
      ...item,

      workflow: {
        waiting_for_owner: item.status === "pending",

        waiting_for_promoter_decision: awaitingDecision,

        can_accept_owner_terms: awaitingDecision && isOriginalRequester,

        can_reject_owner_terms: awaitingDecision && isOriginalRequester,

        promoter_accepted:
          item.status === "approved" &&
          item.promoter_agreement_status === "accepted",

        promoter_rejected:
          item.status === "promoter_rejected" &&
          item.promoter_agreement_status === "rejected",

        permanently_blocked_from_requesting_again:
          item.status === "promoter_rejected",
      },
    };
  });

  return {
    data,
    meta,
  };
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
  payload: ManagePromoteRequestPayload,
): Promise<IPromoteRequest> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const promoteRequest =
      await PromoteRequest.findById(promoteRequestId).session(session);

    if (!promoteRequest) {
      throw new NotFoundError("Promote request not found");
    }

    const listing = await Listing.findById(promoteRequest.listing_id).session(
      session,
    );

    if (!listing) {
      throw new NotFoundError("Related listing not found");
    }

    if (promoteRequest.status !== "pending") {
      throw new BadRequestError("Only pending promote requests can be managed");
    }

    const isOwner = String(listing.associate_id) === String(authUser.id);
    const isAdmin = isAdminOrManager(authUser.role);

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedError(
        "You are not authorized to manage this promote request",
      );
    }

    if (payload.status === "approved") {
      if (!payload.selected_tier) {
        throw new BadRequestError(
          "selected_tier is required when approving a request",
        );
      }

      // if (
      //   payload.confirmed_commission_pct === undefined ||
      //   payload.confirmed_commission_pct < 0 ||
      //   payload.confirmed_commission_pct > 100
      // ) {
      //   throw new BadRequestError(
      //     "A valid confirmed_commission_pct is required",
      //   );
      // }

      promoteRequest.status = "owner_approved";
      promoteRequest.selected_tier = payload.selected_tier;
      // promoteRequest.confirmed_commission_pct =
      //   payload.confirmed_commission_pct;

      promoteRequest.promoter_agreement_status = "pending";
      promoteRequest.owner_approved_at = new Date();
      promoteRequest.resolved_at = undefined;
    }

    if (payload.status === "rejected") {
      promoteRequest.status = "rejected";
      promoteRequest.promoter_agreement_status = "not_started";
      promoteRequest.resolved_at = new Date();
    }

    await promoteRequest.save({ session });

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
      "This promotion request has not been approved yet",
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

const respondToOwnerTermsInDB = async (
  promoteRequestId: string,
  requesterId: string,
  payload: RespondToOwnerTermsPayload,
): Promise<IPromoteRequest> => {
  if (
    !payload.decision ||
    !["accepted", "rejected"].includes(payload.decision)
  ) {
    throw new BadRequestError(
      "decision must be either 'accepted' or 'rejected'",
    );
  }

  const session = await mongoose.startSession();

  let completedRequest: IPromoteRequest | null = null;

  let emailPayload: {
    toEmail: string;
    promoterName: string;
    listingTitle: string;
    listingId: string;
    tier: "tier_1" | "tier_2" | "tier_3";
    confirmedCommissionPct: number;
    accessUrl: string;
    promoterWebsiteUrl?: string;
    marketingDocumentUrl?: string;
  } | null = null;

  try {
    session.startTransaction();

    const promoteRequest = await PromoteRequest.findOne({
      _id: promoteRequestId,
      is_deleted: { $ne: true },
    }).session(session);

    if (!promoteRequest) {
      throw new NotFoundError("Promote request not found");
    }


    if (String(promoteRequest.requester.user_id) !== String(requesterId)) {
      throw new UnauthorizedError(
        "Only the promoter who submitted this request can respond to the owner's terms",
      );
    }


    if (promoteRequest.status !== "owner_approved") {
      throw new BadRequestError(
        "This request is not awaiting promoter confirmation",
      );
    }

    if (promoteRequest.promoter_agreement_status !== "pending") {
      throw new BadRequestError("You have already responded to these terms");
    }

    if (payload.decision === "rejected") {
      const rejectionReason = payload.rejection_reason?.trim();

      promoteRequest.status = "promoter_rejected";
      promoteRequest.promoter_agreement_status = "rejected";
      promoteRequest.promoter_rejected_at = new Date();
      promoteRequest.resolved_at = new Date();

      if (rejectionReason) {
        promoteRequest.promoter_rejection_reason = rejectionReason;
      } else {
        promoteRequest.set("promoter_rejection_reason", undefined);
      }

      promoteRequest.set("promoter_website_url", undefined);

      promoteRequest.set("marketing_document_url", undefined);

      promoteRequest.set("access_url", undefined);

      await promoteRequest.save({ session });

      await session.commitTransaction();

      return promoteRequest;
    }

    if (!promoteRequest.selected_tier) {
      throw new BadRequestError(
        "No promotion tier has been assigned to this request",
      );
    }

    const listing = await Listing.findById(promoteRequest.listing_id).session(
      session,
    );

    if (!listing) {
      throw new NotFoundError("Related listing not found");
    }

    const promoterUser = await User.findById(promoteRequest.requester.user_id)
      .select("fullName email")
      .session(session);

    const promoterWebsiteUrl =
      payload.promoter_website_url?.trim() || undefined;

    const marketingDocumentUrl =
      payload.marketing_document_url?.trim() || undefined;

    if (promoterWebsiteUrl) {
      try {
        new URL(promoterWebsiteUrl);
      } catch {
        throw new BadRequestError("promoter_website_url must be a valid URL");
      }
    }

    if (marketingDocumentUrl) {
      try {
        new URL(marketingDocumentUrl);
      } catch {
        throw new BadRequestError("marketing_document_url must be a valid URL");
      }
    }


    const frontendUrl = String(config.FRONTEND_URL ?? "")
      .trim()
      .replace(/\/+$/, "");

    if (!frontendUrl) {
      throw new BadRequestError("FRONTEND_URL is not configured");
    }


    const accessUrl =
      `${frontendUrl}/promote-request/public/` + promoteRequest._id.toString();


    promoteRequest.status = "approved";
    promoteRequest.promoter_agreement_status = "accepted";

    promoteRequest.promoter_accepted_at = new Date();
    promoteRequest.resolved_at = new Date();


    promoteRequest.set("promoter_rejection_reason", undefined);

    promoteRequest.set("promoter_rejected_at", undefined);

    if (promoterWebsiteUrl) {
      promoteRequest.promoter_website_url = promoterWebsiteUrl;
    } else {
      promoteRequest.set("promoter_website_url", undefined);
    }

    if (marketingDocumentUrl) {
      promoteRequest.marketing_document_url = marketingDocumentUrl;
    } else {
      promoteRequest.set("marketing_document_url", undefined);
    }

    promoteRequest.access_url = accessUrl;

    await promoteRequest.save({ session });

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
      {
        session,
        runValidators: true,
      },
    );


    const alreadyAddedToPromoter = await Promoter.exists({
      user_id: promoteRequest.requester.user_id,

      "listings.promotion_request_id": promoteRequest._id,
    }).session(session);

    if (!alreadyAddedToPromoter) {
      await Promoter.findOneAndUpdate(
        {
          user_id: promoteRequest.requester.user_id,
        },
        {
          $setOnInsert: {
            user_id: promoteRequest.requester.user_id,

            user: promoteRequest.requester.user_id,
          },

          $push: {
            listings: {
              listing_id: listing._id,

              listing_title: listing.title,

              listing_price: listing.price?.amount ?? 0,

              listing_owner_id: listing.associate_id,

              promotion_request_id: promoteRequest._id,

              tier: promoteRequest.selected_tier,

              approved_by: listing.associate_id,

              approved_at: promoteRequest.owner_approved_at ?? new Date(),

              promoter_accepted_at: new Date(),

              promoter_website_url: promoterWebsiteUrl,

              marketing_document_url: marketingDocumentUrl,

              access_url: accessUrl,

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
    }


    await commissionLedgerService.createPendingCommissionFromPromotionApproval({
      listing_id: listing._id.toString(),

      promotion_request_id: promoteRequest._id.toString(),

      approved_by: listing.associate_id.toString(),

      promoteRequest,
      listing,
      session,
    });

    emailPayload = {
      toEmail: promoterUser?.email ?? promoteRequest.requester.email,

      promoterName: promoterUser?.fullName ?? "Promoter",

      listingTitle: listing.title,

      listingId: listing._id.toString(),

      tier: promoteRequest.selected_tier,

      confirmedCommissionPct: promoteRequest.confirmed_commission_pct ?? 0,

      accessUrl,

      ...(promoterWebsiteUrl ? { promoterWebsiteUrl } : {}),

      ...(marketingDocumentUrl ? { marketingDocumentUrl } : {}),
    };

    completedRequest = promoteRequest;

    await session.commitTransaction();
  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }


  if (emailPayload) {
    try {
      await sendPromotionApprovalEmail(emailPayload);
    } catch (error) {
      console.error("Promotion approval email failed:", error);
    }
  }

  if (!completedRequest) {
    throw new Error("Unable to complete promoter decision");
  }

  return completedRequest;
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
  // acceptOwnerTermsInDB,
  respondToOwnerTermsInDB,
};
