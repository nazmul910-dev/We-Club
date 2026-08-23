import { Room } from "./room.modal";
import { resolveCountry } from "../../utility/country";

export const getGeneralRoom = async (createdBy: string) => {
  return Room.findOneAndUpdate(
    { type: "general" },
    {
      $setOnInsert: {
        name: "General Community",
        createdBy,
        type: "general",
      },
    },
    { upsert: true, new: true },
  );
};

export const getOrCreateCountryRoom = async (
  countryName: string,
  createdBy: string,
) => {
  const country = resolveCountry(countryName);

  if (!country) {
    throw new Error("Invalid country name");
  }

  return Room.findOneAndUpdate(
    { countryCode: country.code, type: "country" },
    {
      $setOnInsert: {
        name: `${country.name} Community`,
        createdBy,
        countryCode: country.code,
        countryName: country.name,
        type: "country",
      },
    },
    { upsert: true, new: true },
  );
};