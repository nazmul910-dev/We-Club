import { Types } from 'mongoose';

export interface IRoom {
  name: string;
  description?: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  type: "general" | "country";
  countryName?: string;
  countryCode?: string;
}