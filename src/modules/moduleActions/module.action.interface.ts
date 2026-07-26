import { Types } from "mongoose";

export const MODULE_ACTION_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type ModuleActionStatus =
  (typeof MODULE_ACTION_STATUSES)[number];

export interface IModuleAction {
  module: Types.ObjectId;

  title: string;
  description?: string | undefined;

  order: number;
  isRequired: boolean;
  pointsReward: number;

  status: ModuleActionStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateModuleAction {
  title: string;
  description?: string | undefined;

  order: number;

  isRequired?: boolean | undefined;
  pointsReward?: number | undefined;
}

export interface IUpdateModuleAction {
  title?: string | undefined;

  description?:
    | string
    | null
    | undefined;

  order?: number | undefined;

  isRequired?: boolean | undefined;
  pointsReward?: number | undefined;
}