import { NotFoundError } from "../../utility/errorResponses";
import { escapeRegex } from "../../utility/escaperegax";
import QueryBuilder from "../../utility/queryBuilder";
import { User } from "../users/users.model.schema";
import { IPromoter } from "./promoters.interface";
import { Promoter } from "./promoters.model.schema";

 
const getPromotersFromDB = async (query: Record<string, unknown>) => {
  const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };
 
  let baseQuery = Promoter.find().populate("user");
 
  const searchTerm = (query.search as string | undefined)?.trim();
  if (searchTerm) {
    // `user` is a populated ref, not embedded data — MongoDB can't filter
    // Promoter documents by a field that only exists on the User
    // collection. Resolve matching User _ids first (a real query against
    // `users`), then filter Promoter by `user: { $in: matchingUserIds }`.
    const matchingUserIds = await User.find({
      fullName: { $regex: escapeRegex(searchTerm), $options: "i" },
    }).distinct("_id");
 
    baseQuery = baseQuery.find({ user: { $in: matchingUserIds } });
  }
 
  // NOTE: .search([...]) removed from the chain below — the search is now
  // handled above, before QueryBuilder is even constructed, since it needs
  // a cross-collection lookup that QueryBuilder's plain .find()-based
  // .search() can't do.
  const listingQuery = new QueryBuilder<IPromoter>(baseQuery, queryWithDefaultSort)
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
  return result
}


const incrementPromoterViewCountInDB = async(id : string) => {
  const profile = await Promoter.findByIdAndUpdate(
    id, 
    {$inc : {profile_views : 1}},
    {new : true, select  : "profile_views"}
  )
  if(!profile){
    throw new NotFoundError("Listing not found")
  }
  return profile;
}


export const promotersServices = {
    getPromotersFromDB,
    incrementPromoterViewCountInDB
}