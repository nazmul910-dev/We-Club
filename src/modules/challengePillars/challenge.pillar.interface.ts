import { Types } from "mongoose";

export const PILLAR_NAMES = ["FEARLESS", "LIMITLESS", "BORDERLESS"] as const;

export const PILLAR_SLUGS = ["fearless", "limitless", "borderless"] as const;

export const PILLAR_ICONS = ["crown", "infinity", "globe"] as const;

export const PILLAR_STATUSES = ["draft", "published", "archived"] as const;

export const INTRO_VIDEO_STATUSES = [
  "not_uploaded",
  "processing",
  "ready",
  "failed",
] as const;

export type PillarName = (typeof PILLAR_NAMES)[number];

export type PillarSlug = (typeof PILLAR_SLUGS)[number];

export type PillarIcon = (typeof PILLAR_ICONS)[number];

export type PillarStatus = (typeof PILLAR_STATUSES)[number];

export type IntroVideoStatus = (typeof INTRO_VIDEO_STATUSES)[number];

export interface IPillarIntroVideo {
  cloudinaryPublicId?: string | undefined;
  cloudinaryAssetId?: string | undefined;

  secureUrl?: string | undefined;
  playbackUrl?: string | undefined;
  thumbnailUrl?: string | undefined;

  durationSeconds?: number | undefined;
  format?: string | undefined;
  bytes?: number | undefined;

  status: IntroVideoStatus;
}

export interface IChallengePillar {
  name: PillarName;
  slug: PillarSlug;

  title: string;
  tagline: string;
  description: string;

  icon: PillarIcon;
  accentColor: string;

  isPaid: boolean;
  priceCents: number;
  currency: "usd";

  stripePriceId?: string | undefined;

  introVideo: IPillarIntroVideo;

  order: number;
  status: PillarStatus;

  publishedAt?: Date | undefined;
  archivedAt?: Date | undefined;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICreateChallengePillar {
  name: PillarName;
  slug: PillarSlug;

  title: string;
  tagline: string;
  description: string;

  icon: PillarIcon;
  accentColor?: string | undefined;

  isPaid?: boolean | undefined;
  priceCents?: number | undefined;
  currency?: "usd" | undefined;
  stripePriceId?: string | undefined;

  introVideo?: Partial<IPillarIntroVideo> | undefined;

  order: number;
}

export interface IUpdateChallengePillar {
  title?: string | undefined;
  tagline?: string | undefined;
  description?: string | undefined;

  accentColor?: string | undefined;

  isPaid?: boolean | undefined;
  priceCents?: number | undefined;
  currency?: "usd" | undefined;

  stripePriceId?: string | null | undefined;

  introVideo?: Partial<IPillarIntroVideo> | undefined;
}
