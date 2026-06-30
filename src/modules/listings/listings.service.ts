
import { ObjectId } from "mongodb";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "./listings.interface";
import { Listing } from "./listings.model.schema";
import { NotFoundError, UnauthorizedError } from "../../utility/errorResponses";
import { PromoteRequest } from "../listingPromote/listings.promote.request.model.schema";
import mongoose from "mongoose";

/**
 * Service layer: owns all DB interaction + business logic for Listing.
 * Controllers should never talk to the model directly — always go through here.
 */

 const createListingInDB = async (
  payload: Partial<IListing>
): Promise<IListing> => {

    console.log("payload ", payload)
  const listing = new Listing(payload);
  return await listing.save();
};

 const getAllListingFromDB = async (
  query: Record<string, unknown>
): Promise<{ data: IListing[]; meta: { page: number; limit: number; total: number; totalPage: number } }> => {
  // NOTE: QueryBuilder.sort() defaults to "-createdAt", but this schema's
  // timestamps are mapped to "created_at"/"updated_at" (snake_case).
  // If the caller doesn't pass ?sort=, force the correct default here.
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };

  const listingQuery = new QueryBuilder<IListing>(
    Listing.find().populate("associate_id", "name email"),
    queryWithDefaultSort
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
    meta
  }

  return result;
};


const getMyListingFromDB = async (
  associateId: string,
  query: Record<string, unknown> = {}
): Promise<{ data: IListing[]; meta: { page: number; limit: number; total: number; totalPage: number } }> => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };
 
 
  const listingQuery = new QueryBuilder<IListing>(
    Listing.find({ associate_id: associateId }),
    queryWithDefaultSort
  )
    .search(["title", "ref_code"])
    .filter()
    .sort()
    .paginate()
    .fieldsLimit();
 
  const data = await listingQuery.modelQuery;
  const meta = await listingQuery.countTotal();

  const result = {
    data, meta
  }
 
  return result;
};


const getListingByIdFromDB = async (
  id: string
): Promise<IListing | null> => {
  return await Listing.findById(id).populate("associate_id", "name email");
};
 
const updateListingInDB = async (
  id: string,
  associateId: string,
  payload: Partial<IListing>
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);
 
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  const isOwner = listing.associate_id.toString() !== associateId.toString()
 
  if (!isOwner) {
    throw new UnauthorizedError("You are not authorized to update this listing");
  }
 
  // Prevent associates from sneaking in fields they shouldn't control directly
  // (e.g. promoters is managed only via approved PromoteRequests, not direct edits).
  const { promoters, associate_id, ...safePayload } = payload as Record<string, unknown> & Partial<IListing>;
 
  return await Listing.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true,
  });
};

const deleteListingFromDB = async (
  id: string,
  userId: string,
  role : string,
): Promise<IListing | null> => {
  const listing = await Listing.findById(id);
 
  if (!listing) {
    throw new Error("Listing not found");
  }

    const isOwner = listing.associate_id.toString() === userId.toString();
    const isAdmin = role === "admin";
 
  if (!isOwner && !isAdmin) {
  throw new UnauthorizedError("You are not authorized to delete this listing");
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
      { session }
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

export const listingsService = {
    createListingInDB, getAllListingFromDB, getListingByIdFromDB, updateListingInDB, deleteListingFromDB, getMyListingFromDB
}


