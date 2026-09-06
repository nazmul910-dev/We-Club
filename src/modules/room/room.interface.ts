import { Types } from 'mongoose';

export interface IRoom {
  name: string;
  description?: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  type: "general" | "country" | "private";
  slug?: string;
  countryName?: string;
  countryCode?: string;
}