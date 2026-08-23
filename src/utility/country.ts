// utils/country.ts
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

/**
 * Resolves a free-text country name (as stored on the user doc)
 * to a canonical ISO 3166-1 alpha-2 code + official name.
 * Returns null if it can't confidently match.
 */
export const resolveCountry = (
  rawName: string | undefined | null
): { code: string; name: string } | null => {
  if (!rawName) return null;

  const trimmed = rawName.trim();
  const code = countries.getAlpha2Code(trimmed, "en");

  if (!code) return null;

  return {
    code: code.toUpperCase(),
    name: countries.getName(code, "en") as string, // canonical spelling
  };
};