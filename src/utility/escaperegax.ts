// Escapes regex-special characters so a raw search term is always treated
// as literal text, never as regex syntax (e.g. "Dr. Smith" won't have the
// "." match any character). Shared between QueryBuilder.search() and any
// place, like getPromotersFromDB, that needs to build its own $regex query
// outside of QueryBuilder's normal .find()-chaining (e.g. because it needs
// to search a referenced/populated collection first).
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}