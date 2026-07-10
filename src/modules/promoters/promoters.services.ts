import QueryBuilder from "../../utility/queryBuilder";
import { IPromoter } from "./promoters.interface";
import { Promoter } from "./promoters.model.schema";

const getPromotersFromDB = async( query: Record<string, unknown>,)  => {

      const queryWithDefaultSort = {
    sort: "-created_at",
    ...query,
  };

  const listingQuery = new QueryBuilder<IPromoter>(
    Promoter.find(),
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


export const promotersServices = {
    getPromotersFromDB
}