import { model, Schema } from "mongoose";

import {
  COUNTRY_ROOM_REQUEST_STATUSES,
  ICountryRoomRequest,
} from "./country.room.request.interface";

const countryRoomRequestSchema = new Schema<ICountryRoomRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    countryName: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: COUNTRY_ROOM_REQUEST_STATUSES,
      default: "pending",
      required: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true, collection: "countryroomrequests" },
);

countryRoomRequestSchema.index(
  { user: 1, room: 1 },
  { unique: true },
);
countryRoomRequestSchema.index({ status: 1, createdAt: -1 });

export const CountryRoomRequest = model<ICountryRoomRequest>(
  "CountryRoomRequest",
  countryRoomRequestSchema,
);
