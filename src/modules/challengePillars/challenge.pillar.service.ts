import { Types } from "mongoose";

import {
  ICreateChallengePillar,
  IUpdateChallengePillar,
  PillarSlug,
} from "./challenge.pillar.interface";

import { ChallengePillar } from "./challenge.pillar.model.schema";

const throwServiceError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

function assertPillarExists<T>(
  pillar: T | null | undefined,
  message = "Challenge pillar not found",
): asserts pillar is T {
  if (!pillar) {
    throwServiceError(message, 404);
  }
}

const isAdminOrManager = (role?: string): boolean => {
  return role === "admin" || role === "manager" || role === "founder";
};

const validatePaymentConfiguration = ({
  isPaid,
  priceCents,
  stripePriceId,
}: {
  isPaid: boolean;
  priceCents: number;
  stripePriceId?: string | undefined;
}) => {
  if (isPaid && priceCents <= 0 && !stripePriceId) {
    throwServiceError(
      "Paid pillar requires priceCents or Stripe Price ID",
      400,
    );
  }

  if (!isPaid && priceCents > 0) {
    throwServiceError("Free pillar price must be zero", 400);
  }

  if (!isPaid && stripePriceId) {
    throwServiceError("Free pillar cannot have Stripe Price ID", 400);
  }
};

const createChallengePillar = async (
  payload: ICreateChallengePillar,
  actorId: string,
) => {
  const existingPillar = await ChallengePillar.findOne({
    $or: [
      { name: payload.name },
      { slug: payload.slug },
      { order: payload.order },
    ],
  }).lean();

  if (existingPillar) {
    throwServiceError("Challenge pillar already exists", 409);
  }

  const isPaid = payload.isPaid ?? false;
  const priceCents = payload.priceCents ?? 0;

  validatePaymentConfiguration({
    isPaid,
    priceCents,
    stripePriceId: payload.stripePriceId,
  });

  const pillar = await ChallengePillar.create({
    ...payload,

    accentColor: payload.accentColor ?? "#C9A84C",

    isPaid,
    priceCents,

    currency: payload.currency ?? "usd",

    introVideo: {
      status: "not_uploaded",
      ...payload.introVideo,
    },

    status: "draft",

    createdBy: new Types.ObjectId(actorId),
  });

  return pillar;
};

const seedDefaultChallengePillars = async (actorId: string) => {
  const createdBy = new Types.ObjectId(actorId);

  const defaultPillars = [
    {
      name: "FEARLESS",
      slug: "fearless",

      title: "FEARLESS",

      tagline: "Conquer what holds you back.",

      description: "Conquer fear, build confidence and take decisive action.",

      icon: "crown",

      accentColor: "#C9A84C",

      isPaid: false,
      priceCents: 0,
      currency: "usd",

      introVideo: {
        status: "not_uploaded",
      },

      order: 1,
      status: "draft",

      createdBy,
    },

    {
      name: "LIMITLESS",
      slug: "limitless",

      title: "LIMITLESS",

      tagline: "Expand beyond every boundary.",

      description: "Expand your capacity, ambition and personal limits.",

      icon: "infinity",

      accentColor: "#C9A84C",

      isPaid: true,
      priceCents: 0,
      currency: "usd",

      introVideo: {
        status: "not_uploaded",
      },

      order: 2,
      status: "draft",

      createdBy,
    },

    {
      name: "BORDERLESS",
      slug: "borderless",

      title: "BORDERLESS",

      tagline: "Build without limits or geography.",

      description:
        "Build business, opportunities and relationships without geographic limits.",

      icon: "globe",

      accentColor: "#C9A84C",

      isPaid: true,
      priceCents: 0,
      currency: "usd",

      introVideo: {
        status: "not_uploaded",
      },

      order: 3,
      status: "draft",

      createdBy,
    },
  ];

  await ChallengePillar.bulkWrite(
    defaultPillars.map((pillar) => ({
      updateOne: {
        filter: {
          slug: pillar.slug,
        },

        update: {
          $setOnInsert: pillar,
        },

        upsert: true,
      },
    })) as any,
  );

  return ChallengePillar.find()
    .sort({ order: 1 })
    .populate("createdBy", "fullName email role profileImage")
    .lean();
};

const getAllChallengePillars = async ({
  actorRole,
  includeArchived = false,
}: {
  actorRole?: string;
  includeArchived?: boolean;
}) => {
  const filter: Record<string, unknown> = {};

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived",
    };
  }

  //filter

  return ChallengePillar.find()
    .sort({ order: 1 })
    .populate("createdBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage")
    .lean();
};

const getChallengePillarBySlug = async (
  slug: PillarSlug,
  actorRole?: string,
) => {
  const filter: Record<string, unknown> = {
    slug,
  };

  if (!isAdminOrManager(actorRole)) {
    filter.status = "published";
  }

  const pillar = await ChallengePillar.findOne(filter)
    .populate("createdBy", "fullName email role profileImage")
    .populate("updatedBy", "fullName email role profileImage")
    .lean();

  assertPillarExists(pillar);

  return pillar;
};

const updateChallengePillar = async (
  pillarId: string,
  payload: IUpdateChallengePillar,
  actorId: string,
) => {
  const pillar = await ChallengePillar.findById(pillarId);

  assertPillarExists(pillar);

  if (pillar.status === "archived") {
    throwServiceError("Archived pillar cannot be updated", 400);
  }

  const nextIsPaid = payload.isPaid ?? pillar.isPaid;

  let nextPriceCents = payload.priceCents ?? pillar.priceCents;

  let nextStripePriceId =
    payload.stripePriceId === null
      ? undefined
      : (payload.stripePriceId ?? pillar.stripePriceId);

  if (!nextIsPaid) {
    nextPriceCents = 0;
    nextStripePriceId = undefined;
  }

  validatePaymentConfiguration({
    isPaid: nextIsPaid,
    priceCents: nextPriceCents,
    stripePriceId: nextStripePriceId,
  });

  if (payload.title !== undefined) {
    pillar.title = payload.title;
  }

  if (payload.tagline !== undefined) {
    pillar.tagline = payload.tagline;
  }

  if (payload.description !== undefined) {
    pillar.description = payload.description;
  }

  if (payload.accentColor !== undefined) {
    pillar.accentColor = payload.accentColor;
  }

  pillar.isPaid = nextIsPaid;
  pillar.priceCents = nextPriceCents;

  pillar.currency = payload.currency ?? pillar.currency;

  pillar.stripePriceId = nextStripePriceId;

  if (payload.introVideo !== undefined) {
    pillar.set("introVideo", {
      ...((pillar.introVideo as any)?.toObject?.() ?? pillar.introVideo),
      ...payload.introVideo,
    });
  }

  pillar.updatedBy = new Types.ObjectId(actorId);

  await pillar.save();

  return pillar.populate("updatedBy", "fullName email role profileImage");
};

const publishChallengePillar = async (pillarId: string, actorId: string) => {
  const pillar = await ChallengePillar.findById(pillarId);

  assertPillarExists(pillar);

  if (pillar.status === "archived") {
    throwServiceError("Archived pillar cannot be published", 400);
  }

  validatePaymentConfiguration({
    isPaid: pillar.isPaid,
    priceCents: pillar.priceCents,
    stripePriceId: pillar.stripePriceId,
  });

  pillar.status = "published";
  pillar.publishedAt = new Date();
  pillar.archivedAt = undefined;

  pillar.updatedBy = new Types.ObjectId(actorId);

  await pillar.save();

  return pillar;
};

const moveChallengePillarToDraft = async (
  pillarId: string,
  actorId: string,
) => {
  const pillar = await ChallengePillar.findById(pillarId);

  assertPillarExists(pillar);

  if (pillar.status === "archived") {
    throwServiceError("Archived pillar cannot be moved to draft", 400);
  }

  pillar.status = "draft";
  pillar.publishedAt = undefined;

  pillar.updatedBy = new Types.ObjectId(actorId);

  await pillar.save();

  return pillar;
};

const archiveChallengePillar = async (pillarId: string, actorId: string) => {
  const pillar = await ChallengePillar.findById(pillarId);

  assertPillarExists(pillar);

  pillar.status = "archived";
  pillar.archivedAt = new Date();
  pillar.publishedAt = undefined;

  pillar.updatedBy = new Types.ObjectId(actorId);

  await pillar.save();

  return pillar;
};

export const challengePillarService = {
  createChallengePillar,
  seedDefaultChallengePillars,

  getAllChallengePillars,
  getChallengePillarBySlug,

  updateChallengePillar,

  publishChallengePillar,
  moveChallengePillarToDraft,
  archiveChallengePillar,
};
