import { ObjectId } from "mongodb";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing, ListingStatus } from "./listings.interface";
import { Listing } from "./listings.model.schema";
import { NotFoundError, UnauthorizedError } from "../../utility/errorResponses";
import { PromoteRequest } from "../listingPromote/listings.promote.request.model.schema";
import mongoose from "mongoose";
import { ListingViewStats } from "./listings.viewsHistory.modal.schema";

const generateRefCode = (): string => {
  const digits = Math.floor(100000 + Math.random() * 900000); 
  return `WE-${digits}`;
};

const generateUniqueRefCode = async (): Promise<string> => {
  let refCode = generateRefCode();
  let exists = await Listing.exists({ ref_code: refCode });

  while (exists) {
    refCode = generateRefCode();
    exists = await Listing.exists({ ref_code: refCode });
  }

  return refCode;
};

const createListingInDB = async (
  payload: Partial<IListing>,
  creatorRole?: string,
): Promise<IListing> => {
  const { ref_code, ...safePayload } = payload;

  let attempts = 0;
  while (attempts < 5) {
    try {
      const listing = new Listing({
        ...safePayload,
        ref_code: generateRefCode(),
        ...(creatorRole === "founder" && { status: "active" }),
      });
      return await listing.save();
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.ref_code) {
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate a unique reference code. Please try again.");
};

const getAllListingFromDB = async (
  query: Record<string, unknown>,
): Promise<{
  data: IListing[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {

  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };
  // .populate("associate_id", "fullName email phone city country brokerage profileImage accountStatus role")
  const listingQuery = new QueryBuilder<IListing>(
    Listing.find().populate(
      "associate_id",
      "fullName email bio phone city country brokerage profileImage licenseNumber role accountStatus approvalStatus"
    ),
    
    queryWithDefaultSort,
  )
    .search(["title", "ref_code","location.country"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();

  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();

  const result = {
    data,
    meta,
  };

  return result;
};

const getMyListingFromDB = async (
  associateId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: IListing[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };

  const listingQuery = new QueryBuilder<IListing>(
    Listing.find({ associate_id: associateId }),
    queryWithDefaultSort,
  )
    .search(["title", "ref_code"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();

  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();

  const result = {
    data,
    meta,
  };

  return result;
};

const getListingByIdFromDB = async (id: string): Promise<IListing | null> => {
  return await Listing.findById(id).populate("associate_id", "name email");
};

const getMyPromotersFromDB = async (
  associateId: string,
): Promise<
  {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    tier: string;
    totalListingsCount: number;
    totalListingsValue: { amount: number; currency: string }[];
  }[]
> => {
  const result = await Listing.aggregate([
    // 1. Only this associate's listings, not soft-deleted
    {
      $match: {
        associate_id: new mongoose.Types.ObjectId(associateId),
        is_deleted: false,
      },
    },

    { $unwind: "$promoters" },

    {
      $group: {
        _id: "$promoters.user_id",
        tier: { $last: "$promoters.tier" },
        totalListingsCount: { $sum: 1 },
        listingPrices: {
          $push: {
            amount: "$price.amount",
            currency: "$price.currency",
          },
        },
      },
    },


    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { fullName: 1, email: 1, phone: 1, _id: 0 } }],
      },
    },

    { $unwind: "$user" },

    {
      $project: {
        _id: 0,
        user_id: "$_id",
        name: "$user.fullName",
        email: "$user.email",
        phone: "$user.phone",
        tier: 1,
        totalListingsCount: 1,
        listingPrices: 1,
      },
    },

    { $sort: { totalListingsCount: -1 } },
  ]);

  return result;
};

const updateListingInDB = async (
  id: string,
  associateId: string,
  payload: Partial<IListing>,
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  const isOwner = listing.associate_id.toString() !== associateId.toString();

  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to update this listing",
    );
  }

  const { promoters, associate_id, ...safePayload } = payload as Record<
    string,
    unknown
  > &
    Partial<IListing>;

  return await Listing.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true,
  });
};

const deleteListingFromDB = async (
  id: string,
  userId: string,
  role: string,
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new Error("Listing not found");
  }

  const isOwner = listing.associate_id.toString() === userId.toString();
  const isFounder = role === "founder";

  if (!isOwner && !isFounder) {
    throw new UnauthorizedError(
      "You are not authorized to delete this listing",
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    listing.is_deleted = true;
    listing.deleted_at = new Date();
    await listing.save({ session });

    await PromoteRequest.updateMany(
      { listing_id: id, is_deleted: false },
      { is_deleted: true, deleted_at: new Date() },
      { session },
    );

    await session.commitTransaction();
    return listing;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const cancelPendingListingInDB = async (
  id: string,
  userId: string,
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  const isOwner = listing.associate_id.toString() === userId.toString();

  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to cancel this listing",
    );
  }

  listing.status = "draft";
  return await listing.save();
};

const deletePendingListingInDB = async (
  id: string,
  userId: string,
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  const isOwner = listing.associate_id.toString() === userId.toString();

  if (!isOwner) {
    throw new UnauthorizedError(
      "You are not authorized to delete this listing",
    );
  }

  listing.is_deleted = true;
  listing.deleted_at = new Date();
  return await listing.save();
};

const manageListings = async (
  id: string,
  status: ListingStatus,
  // message: string
) => {
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  listing.status = status;

  return await listing.save();
};

const incrementListingViewCountInDB = async (id: string) => {
  const listing = await Listing.findByIdAndUpdate(
    id,
    { $inc: { listings_view: 1 } },
    { new: true, select: "listings_view" },
  );
  await trackListingView(id);

  if (!listing) {
    throw new NotFoundError("Listing not found");
  }
  return listing;
};

export const trackListingView = async (listingId: string) => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  await Promise.all([
    Listing.findByIdAndUpdate(listingId, {
      $inc: {
        totalViews: 1,
      },
    }),

    ListingViewStats.updateOne(
      {
        listing: listingId,
        date: today,
      },
      {
        $inc: {
          views: 1,
        },
      },
      {
        upsert: true,
      },
    ),
  ]);
};

export const listingsService = {
  createListingInDB,
  getAllListingFromDB,
  getListingByIdFromDB,
  updateListingInDB,
  deleteListingFromDB,
  getMyListingFromDB,
  getMyPromotersFromDB,
  cancelPendingListingInDB,
  deletePendingListingInDB,
  manageListings,
  incrementListingViewCountInDB,
};
