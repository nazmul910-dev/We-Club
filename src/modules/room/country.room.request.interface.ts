import { Types } from "mongoose";

export const COUNTRY_ROOM_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type CountryRoomRequestStatus =
  (typeof COUNTRY_ROOM_REQUEST_STATUSES)[number];

export interface ICountryRoomRequest {
  user: Types.ObjectId;
  room: Types.ObjectId;
  countryName: string;
  countryCode: string;
  status: CountryRoomRequestStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
