
import { ObjectId } from "mongodb";
import QueryBuilder from "../../utility/queryBuilder";
import { IListing } from "./listings.interface";
import { Listing } from "./listings.model.schema";

/**
 * Service layer: owns all DB interaction + business logic for Listing.
 * Controllers should never talk to the model directly — always go through here.
 */

 const createListingInDB = async (
  payload: Partial<IListing>
): Promise<IListing> => {
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


 const getListingByIdFromDB = async (
  id: string
): Promise<IListing | null> => {
  return await Listing.findById(id).populate("associate_id", "name email");
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

 const updateListingInDB = async (
  id: string,
  payload: Partial<IListing>
): Promise<IListing | null> => {
  return await Listing.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

 const deleteListingFromDB = async (
  id: string
): Promise<IListing | null> => {
  return await Listing.findByIdAndDelete(id);
};



export const listingsService = {
    createListingInDB, getAllListingFromDB, getListingByIdFromDB, updateListingInDB, deleteListingFromDB, getMyListingFromDB
}


