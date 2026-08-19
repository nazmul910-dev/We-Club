import { Types } from "mongoose";

export interface ILeaderboardEntryBreakdown {
  [key: string]: number;
}

export interface ILeaderboardEntry {
  leaderboard: Types.ObjectId;
  user: Types.ObjectId;

  points: number;
  rank: number | null;

  breakdown?: ILeaderboardEntryBreakdown | undefined;

  lastUpdatedAt: Date;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IUpsertLeaderboardPointsPayload {
  userId: string;
  pointsDelta: number;

  breakdownKey?: string | undefined;
}

export interface IGetLeaderboardEntriesQuery {
  page?: number | undefined;
  limit?: number | undefined;
}
