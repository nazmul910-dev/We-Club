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

  // Escapes characters that have special meaning in a regex (. * + ? ( ) [
  // ] { } ^ $ |) so a search term is always treated as literal text, never
  // as regex syntax. Without this, searching something like "Dr. Smith" or
  // "C++" would have those symbols interpreted as regex operators instead
  // of literal characters — silently breaking matches for real names — and
  // more importantly, it means arbitrary user input flows straight into a
  // MongoDB regex unescaped, which is a real injection/ReDoS surface.
  //
  // Public (not private) so any other service can reuse it directly, e.g.
  // when it needs to search a REFERENCED collection first — you can't
  // filter Promoter by a populated User field via a plain .find(), so
  // getPromotersFromDB resolves matching User _ids itself first, and needs
  // this same escaping for that separate query:
  //   QueryBuilder.escapeRegex(searchTerm)
  static escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.search?.trim();

    if (searchTerm) {
      const safeSearchTerm = QueryBuilder.escapeRegex(searchTerm);
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: safeSearchTerm, $options: "i" },
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