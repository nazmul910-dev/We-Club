import { Query } from "mongoose";

interface QueryParams {
  search?: string;
  sort?: string;
  limit?: string;
  page?: string;
  fields?: string;
  [key: string]: any;
}

class QueryBuilder<T> {
  public modelQuery: Query<any, T>;
  public query: QueryParams;

  // Fields that are query-control params, not actual filter fields
  private static readonly EXCLUDED_FIELDS = ["search", "sort", "limit", "page", "fields"];

  constructor(modelQuery: Query<any, T>, query: QueryParams) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.search?.trim();

    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    QueryBuilder.EXCLUDED_FIELDS.forEach((field) => delete queryObj[field]);

    // Support operators like price[gte]=100&price[lte]=500
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, (match) => `$${match}`);

    this.modelQuery = this.modelQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    const sortBy = this.query.sort?.split(",").join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sortBy);
    return this;
  }

  paginate() {
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // Bonus: field selection support (e.g. ?fields=name,email)
  fieldsLimit() {
    const fields = this.query.fields?.split(",").join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // Bonus: get total count for pagination metadata (call separately, not chained)
  async countTotal() {
    const filterQuery = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(filterQuery);
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.max(Number(this.query.limit) || 10, 1);
    const totalPage = Math.ceil(total / limit);

    return { page, limit, total, totalPage };
  }
}

export default QueryBuilder;