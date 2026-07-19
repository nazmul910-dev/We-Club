import { NotFoundError } from "../../utility/errorResponses";
import QueryBuilder from "../../utility/queryBuilder";
import { IPromoter } from "./promoters.interface";
import { Promoter } from "./promoters.model.schema";

const getPromotersFromDB = async( query: Record<string, unknown>,)  => {

      const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };

  const listingQuery = new QueryBuilder<IPromoter>(
    Promoter.find().populate("user").lean(),
    queryWithDefaultSort,
  )

  
    .search(["fullName", ])
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