import { ClientSession, Types } from "mongoose";
import { Listing } from "../listings/listings.model.schema";
import { UserRole } from "../users/user.interface";
import { CommissionLedger } from "./commission.ledger.model.schema";
import {
  calculateCommissionAmount,
  calculatePlatformFeeAmount,
  shouldApplyPlatformFee,
} from "./commission.ledger.utils";
import { PromoteRequest } from "../listingPromote/listings.promote.request.model.schema";
import { IPromoteRequest } from "../listingPromote/listing.promote.interface";
import { IListing } from "../listings/listings.interface";
import { CommissionPaymentMethod } from "./commision.ledger.interface";
import assertFound from "../../utility/assertFound";

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

type CreatePendingCommissionPayload = {
  listing_id: string;
  promotion_request_id: string;
  approved_by: string;
  promoteRequest: IPromoteRequest;
  listing: IListing;
  session: ClientSession;
};

type CreateManualCommissionPayload = {
  listing_id: string;
  promoter_id: string;
  final_commission_amount?: number | undefined;
  note?: string | undefined;
};

type ConfirmCommissionPayload = {
  final_commission_pct: number;
  deal_closed_at?: string | undefined;
  note?: string | undefined;
};

type MarkCommissionPaidPayload = {
  payment_method?:
    | "bank_transfer"
    | "stripe"
    | "helcim"
    | "cash"
    | "check"
    | "other"
    | undefined;
  payment_reference?: string | undefined;
  note?: string | undefined;
};

type ConfirmReceivedPayload = {
  note?: string | undefined;
};

type DisputeCommissionPayload = {
  reason: string;
};

type ResolveDisputePayload = {
  final_status: "pending" | "confirmed" | "paid" | "cancelled";
  resolution_note: string;
};

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

const getPaginationParams = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throwError("Invalid id", 400);
  }

  return new Types.ObjectId(id);
};

const isAdminOrManager = (role: UserRole): boolean => {
  return role === "founder" || role === "manager";
};

const isSameId = (idA: unknown, idB: string): boolean => {
  return String(idA) === String(idB);
};

const ensureValueExists = <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number,
): NonNullable<T> => {
  if (value == null) {
    throwError(message, statusCode);
  }

  return value as NonNullable<T>;
};

const ensureCommissionExists = <T extends object>(
  commission: T | null | undefined,
): T => {
  return ensureValueExists(commission, "Commission record not found", 404);
};

const populateCommissionQuery = () => {
  return [
    {
      path: "listing_id",
      select: "title ref_code price referral_commission cover_image",
    },
    { path: "listing_owner_id", select: "fullName email role" },
    { path: "promoter_id", select: "fullName email role" },
    { path: "created_by", select: "fullName email role" },
  ];
};

export const createPendingCommissionFromPromotionApproval = async ({
  listing_id,
  promotion_request_id,
  approved_by,
  promoteRequest,
  listing,
  session,
}: CreatePendingCommissionPayload & {
  session?: ClientSession;
}) => {
  // promoter_id comes from the passed-in promoteRequest — no extra DB query needed
  const promoter_id = promoteRequest.requester.user_id.toString();

  const listingPriceAmount = listing.price.amount;

  // const commissionRatePercent = listing.referral_commission.offered_amount;

  const commissionRatePercent =
    promoteRequest.proposed_commission_pct ??
    listing.referral_commission.offered_amount;

  const estimatedCommissionAmount = calculateCommissionAmount(
    listingPriceAmount,
    commissionRatePercent,
  );

  const commission = await CommissionLedger.findOneAndUpdate(
    {
      promotion_request_id: toObjectId(promotion_request_id),
      promoter_id: toObjectId(promoter_id),
    },
    {
      $setOnInsert: {
        listing_id: toObjectId(listing_id),
        promotion_request_id: toObjectId(promotion_request_id),
        listing_owner_id: listing.associate_id,
        promoter_id: toObjectId(promoter_id),
        created_by: toObjectId(approved_by),

        status: "pending",
        currency: listing.price.currency,

        listing_price_amount: listingPriceAmount,
        commission_rate_percent: commissionRatePercent,
        estimated_commission_amount: estimatedCommissionAmount,

        is_frozen: false,

        status_history: [
          {
            status: "pending",
            changed_by: toObjectId(approved_by),
            changed_at: new Date(),
            note: "Commission created automatically when promotion request was approved.",
          },
        ],
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      session,
    },
  );

  return ensureCommissionExists(commission);
};

const getMyCommissionsFromDB = async (
  authUser: AuthUser,
  query: Record<string, unknown>,
): Promise<{ data: unknown[]; meta: PaginationMeta }> => {
  const filter: Record<string, unknown> = {
    $or: [
      { listing_owner_id: toObjectId(authUser.id) },
      { promoter_id: toObjectId(authUser.id) },
    ],
  };

  if (typeof query.status === "string") {
    filter.status = query.status;
  }

  const { page, limit, skip } = getPaginationParams(query);

  // Run the page of results and the total count in parallel — same filter,
  // one for `.find()`, one for `.countDocuments()`.
  const [data, total] = await Promise.all([
    CommissionLedger.find(filter)
      .populate(populateCommissionQuery())
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    CommissionLedger.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const getAllCommissionsFromDB = async (
  query: Record<string, unknown>,
): Promise<{ data: unknown[]; meta: PaginationMeta }> => {
  const filter: Record<string, unknown> = {};

  if (typeof query.status === "string") {
    filter.status = query.status;
  }

  if (typeof query.promoter_id === "string") {
    filter.promoter_id = toObjectId(query.promoter_id);
  }

  if (typeof query.listing_owner_id === "string") {
    filter.listing_owner_id = toObjectId(query.listing_owner_id);
  }

  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    CommissionLedger.find(filter)
      .populate(populateCommissionQuery())
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    CommissionLedger.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const getSingleCommissionFromDB = async (
  commissionId: string,
  authUser: AuthUser,
) => {
  const commission = await CommissionLedger.findById(commissionId)
    .populate(populateCommissionQuery())
    .lean();

  const safeCommission = ensureCommissionExists(commission);

  const canView =
    isAdminOrManager(authUser.role) ||
    isSameId(safeCommission.listing_owner_id, authUser.id) ||
    isSameId(safeCommission.promoter_id, authUser.id);

  if (!canView) {
    throwError("You are not allowed to view this commission record", 403);
  }

  return safeCommission;
};

const createManualCommissionIntoDB = async (
  authUser: AuthUser,
  payload: CreateManualCommissionPayload,
) => {
  const listing = await Listing.findById(payload.listing_id).lean();
  const safeListing = ensureValueExists(listing, "Listing not found", 404);

  const isListingOwner = isSameId(safeListing.associate_id, authUser.id);

  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError(
      "Only listing owner, admin, or manager can create commission",
      403,
    );
  }

  const listingPriceAmount = safeListing.price.amount;
  const commissionRatePercent = safeListing.referral_commission.offered_amount;
  const estimatedCommissionAmount = calculateCommissionAmount(
    listingPriceAmount,
    commissionRatePercent,
  );

  const finalCommissionAmount =
    payload.final_commission_amount ?? estimatedCommissionAmount;

  const commission = await CommissionLedger.create({
    listing_id: toObjectId(payload.listing_id),
    listing_owner_id: safeListing.associate_id,
    promoter_id: toObjectId(payload.promoter_id),
    created_by: toObjectId(authUser.id),

    status:
      payload.final_commission_amount !== undefined ? "confirmed" : "pending",
    currency: safeListing.price.currency,

    listing_price_amount: listingPriceAmount,
    commission_rate_percent: commissionRatePercent,

    estimated_commission_amount: estimatedCommissionAmount,
    ...(payload.final_commission_amount !== undefined
      ? { final_commission_amount: payload.final_commission_amount }
      : {}),

    platform_fee: {
      rate_percent: 4.5,
      amount: 0,
      status: "pending",
    },

    is_frozen: false,
    ...(payload.note !== undefined ? { note: payload.note } : {}),

    status_history: [
      {
        status:
          payload.final_commission_amount !== undefined
            ? "confirmed"
            : "pending",
        changed_by: toObjectId(authUser.id),
        changed_at: new Date(),
        note: payload.note || "Manual commission record created.",
      },
    ],
  });

  return commission;
};

const confirmCommissionIntoDB = async (
  commissionId: string,
  authUser: AuthUser,
  payload: ConfirmCommissionPayload,
) => {
  const commission = await CommissionLedger.findById(commissionId);

  const safeCommission = ensureCommissionExists(commission);

  if (safeCommission.is_frozen) {
    throwError("This commission is frozen due to a dispute", 400);
  }

  const isListingOwner = isSameId(safeCommission.listing_owner_id, authUser.id);

  if (!isAdminOrManager(authUser.role) && !isListingOwner) {
    throwError(
      "Only listing owner, admin, or manager can confirm commission",
      403,
    );
  }

  if (safeCommission.status !== "pending") {
    throwError("Only pending commission can be confirmed", 400);
  }

  const grossCommissionAmount = calculateCommissionAmount(
    safeCommission.listing_price_amount,
    payload.final_commission_pct,
  );

  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "confirmed",

        final_commission_pct: payload.final_commission_pct,

        final_commission_amount: grossCommissionAmount,

        deal_closed_at: payload.deal_closed_at
          ? new Date(payload.deal_closed_at)
          : new Date(),

        platform_fee: {
          rate_percent: 4.5,
          amount: 0,
          status: "pending",
        },
      },

      $push: {
        status_history: {
          status: "confirmed",
          changed_by: toObjectId(authUser.id),
          changed_at: new Date(),
          note: payload.note || "Commission confirmed.",
        },
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return ensureCommissionExists(updatedCommission);
};

const markCommissionPaidIntoDB = async (
  commissionId: string,
  authUser: AuthUser,
  payload: MarkCommissionPaidPayload,
) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);

  if (safeCommission.is_frozen) {
    throwError("This commission is frozen due to a dispute", 400);
  }

  if (!isAdminOrManager(authUser.role)) {
    throwError("Only admin or manager can mark commission as paid", 403);
  }

  if (safeCommission.status !== "confirmed") {
    throwError("Only confirmed commission can be marked as paid", 400);
  }

  if (!safeCommission.payment_tracking?.sent_at) {
    throwError("Payment has not been sent by listing owner yet", 400);
  }

  if (!safeCommission.payment_tracking?.receiver_confirmed_at) {
    throwError("Promoter has not confirmed receipt yet", 400);
  }

  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "paid",
        "payment_tracking.marked_paid_by": toObjectId(authUser.id),
        "payment_tracking.marked_paid_at": new Date(),
        // ...(payload.payment_method && {
        //   "payment_tracking.payment_method": payload.payment_method,
        // }),
        ...(payload.payment_reference && {
          "payment_tracking.payment_reference": payload.payment_reference,
        }),
        ...(payload.note && { "payment_tracking.note": payload.note }),
      },
      $push: {
        status_history: {
          status: "paid",
          changed_by: toObjectId(authUser.id),
          changed_at: new Date(),
          note: payload.note || "Commission marked as paid by admin.",
        },
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  const safeUpdatedCommission = ensureCommissionExists(updatedCommission);

  await Listing.findByIdAndUpdate(safeUpdatedCommission.listing_id, {
    $set: {
      status: "sold",
      sold_at: new Date(),
    },
  });

  return safeUpdatedCommission;
};

const confirmCommissionReceivedIntoDB = async (
  commissionId: string,
  authUser: AuthUser,
  payload: ConfirmReceivedPayload,
) => {
  const commission = await CommissionLedger.findById(commissionId);
  const safeCommission = ensureCommissionExists(commission);

  if (!isSameId(safeCommission.promoter_id, authUser.id)) {
    throwError("Only the receiving promoter can confirm payment received", 403);
  }

  // status na, sent_at check koro
  if (!safeCommission.payment_tracking?.sent_at) {
    throwError("Payment has not been sent yet", 400);
  }

  if (safeCommission.payment_tracking?.receiver_confirmed_at) {
    throwError("Payment already confirmed as received", 400);
  }

  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        "payment_tracking.receiver_confirmed_by": toObjectId(authUser.id),
        "payment_tracking.receiver_confirmed_at": new Date(),
      },
      $push: {
        status_history: {
          status: safeCommission.status, // still 'confirmed'
          changed_by: toObjectId(authUser.id),
          changed_at: new Date(),
          note: payload.note || "Receiver confirmed payment received.",
        },
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  return ensureCommissionExists(updatedCommission);
};

const disputeCommissionIntoDB = async (
  commissionId: string,
  authUser: AuthUser,
  payload: DisputeCommissionPayload,
) => {
  const commission = await CommissionLedger.findById(commissionId);

  const safeCommission = ensureCommissionExists(commission);

  const isInvolved =
    isSameId(safeCommission.listing_owner_id, authUser.id) ||
    isSameId(safeCommission.promoter_id, authUser.id);

  if (!isAdminOrManager(authUser.role) && !isInvolved) {
    throwError("You are not allowed to dispute this commission", 403);
  }

  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: "disputed",
        is_frozen: true,
        "dispute.opened_by": toObjectId(authUser.id),
        "dispute.opened_at": new Date(),
        "dispute.reason": payload.reason,
      },
      $push: {
        status_history: {
          status: "disputed",
          changed_by: toObjectId(authUser.id),
          changed_at: new Date(),
          note: payload.reason,
        },
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return ensureCommissionExists(updatedCommission);
};

const resolveCommissionDisputeIntoDB = async (
  commissionId: string,
  authUser: AuthUser,
  payload: ResolveDisputePayload,
) => {
  if (!isAdminOrManager(authUser.role)) {
    throwError("Only admin or manager can resolve dispute", 403);
  }

  const updatedCommission = await CommissionLedger.findByIdAndUpdate(
    commissionId,
    {
      $set: {
        status: payload.final_status,
        is_frozen: false,
        "dispute.resolved_by": toObjectId(authUser.id),
        "dispute.resolved_at": new Date(),
        "dispute.resolution_note": payload.resolution_note,
      },
      $push: {
        status_history: {
          status: payload.final_status,
          changed_by: toObjectId(authUser.id),
          changed_at: new Date(),
          note: payload.resolution_note,
        },
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return ensureCommissionExists(updatedCommission);
};

const sendCommissionPaymentIntoDB = async (
  id: string,
  authUser: {
    id: string;
    role: string;
  },
  payload: {
    payment_method: CommissionPaymentMethod;
    payment_reference?: string | undefined;
    note?: string | undefined;
  },
) => {
  const commission = await CommissionLedger.findById(id);

  if (!commission) {
    throwError("Commission not found", 404);
  }

  assertFound(commission, "Commission not found", 404);

  if (commission.listing_owner_id.toString() !== authUser.id) {
    throwError("Only listing owner can send payment", 403);
  }

  if (commission.status !== "confirmed") {
    throwError("Only confirmed commission can be sent for payment", 400);
  }

  if (commission.payment_tracking?.sent_at) {
    throwError("Payment already sent", 400);
  }

  if (!payload.payment_method) {
    throwError("Payment method is required", 400);
  }

  const grossCommissionAmount = Number(commission.final_commission_amount);

  if (!Number.isFinite(grossCommissionAmount) || grossCommissionAmount <= 0) {
    throwError("Final commission amount is invalid", 400);
  }

  // ONLY Stripe / Helcim = 4.5%
  const hasPlatformFee = shouldApplyPlatformFee(payload.payment_method);

  const platformFeeAmount = hasPlatformFee
    ? calculatePlatformFeeAmount(grossCommissionAmount, 4.5)
    : 0;

  const netFinalCommissionAmount = Number(
    (grossCommissionAmount - platformFeeAmount).toFixed(2),
  );

  // এখানে final commission fix হচ্ছে
  commission.final_commission_amount = netFinalCommissionAmount;

  commission.platform_fee = {
    rate_percent: hasPlatformFee ? 4.5 : 0,
    amount: platformFeeAmount,
    status: hasPlatformFee ? "pending" : "not_required",
  };

  commission.payment_tracking = {
    ...commission.payment_tracking,

    sent_by: new Types.ObjectId(authUser.id),

    sent_at: new Date(),

    payment_method: payload.payment_method,

    ...(payload.payment_reference && {
      payment_reference: payload.payment_reference,
    }),

    ...(payload.note && {
      note: payload.note,
    }),
  };

  commission.status_history.push({
    status: commission.status,

    changed_by: new Types.ObjectId(authUser.id),

    changed_at: new Date(),

    note:
      payload.note ||
      `Listing owner sent commission payment via ${payload.payment_method}.`,
  } as any);

  await commission.save();

  return commission;
};



const getMyFinalCommissionTotalFromDB =
  async (authUser: AuthUser) => {
    const result =
      await CommissionLedger.aggregate([
        {
          $match: {
            promoter_id: toObjectId(
              authUser.id
            ),

            status: {
              $in: [
                'confirmed',
                'paid',
              ],
            },

            final_commission_amount: {
              $exists: true,
              $ne: null,
            },

            // Payment method already selected,
            // so final amount is really final
            'payment_tracking.sent_at': {
              $exists: true,
            },
          },
        },

        {
          $group: {
            _id: null,

            total_final_commission: {
              $sum:
                '$final_commission_amount',
            },

            total_commissions: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            total_final_commission: 1,
            total_commissions: 1,
          },
        },
      ]);

    return (
      result[0] ?? {
        total_final_commission: 0,
        total_commissions: 0,
      }
    );
  };


  const getAllFinalCommissionTotalFromDB =
  async () => {
    const result =
      await CommissionLedger.aggregate([
        {
          $match: {
            status: {
              $in: [
                'confirmed',
                'paid',
              ],
            },

            final_commission_amount: {
              $exists: true,
              $ne: null,
            },

            'payment_tracking.sent_at': {
              $exists: true,
            },
          },
        },

        {
          $group: {
            _id: null,

            total_final_commission: {
              $sum:
                '$final_commission_amount',
            },

            total_commissions: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            total_final_commission: 1,
            total_commissions: 1,
          },
        },
      ]);

    return (
      result[0] ?? {
        total_final_commission: 0,
        total_commissions: 0,
      }
    );
  };

export const commissionLedgerService = {
  createPendingCommissionFromPromotionApproval,
  getMyCommissionsFromDB,
  getAllCommissionsFromDB,
  getSingleCommissionFromDB,
  createManualCommissionIntoDB,
  confirmCommissionIntoDB,
  markCommissionPaidIntoDB,
  confirmCommissionReceivedIntoDB,
  disputeCommissionIntoDB,
  resolveCommissionDisputeIntoDB,
  sendCommissionPaymentIntoDB,

  getMyFinalCommissionTotalFromDB,
  getAllFinalCommissionTotalFromDB,
};
