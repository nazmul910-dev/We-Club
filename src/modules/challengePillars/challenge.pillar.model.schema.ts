import { Schema, model } from 'mongoose';

import {
  IChallengePillar,
  INTRO_VIDEO_STATUSES,
  PILLAR_ICONS,
  PILLAR_NAMES,
  PILLAR_SLUGS,
  PILLAR_STATUSES,
} from './challenge.pillar.interface';

const pillarIntroVideoSchema = new Schema(
  {
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },

    cloudinaryAssetId: {
      type: String,
      trim: true,
    },

    secureUrl: {
      type: String,
      trim: true,
    },

    playbackUrl: {
      type: String,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
    },

    durationSeconds: {
      type: Number,
      min: 0,
    },

    format: {
      type: String,
      trim: true,
    },

    bytes: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: INTRO_VIDEO_STATUSES,
      default: 'not_uploaded',
    },
  },
  {
    _id: false,
  }
);

const challengePillarSchema =
  new Schema<IChallengePillar>(
    {
      name: {
        type: String,
        enum: PILLAR_NAMES,
        required: true,
        unique: true,
        trim: true,
      },

      slug: {
        type: String,
        enum: PILLAR_SLUGS,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      tagline: {
        type: String,
        required: true,
        trim: true,
        maxlength: 250,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
      },

      icon: {
        type: String,
        enum: PILLAR_ICONS,
        required: true,
      },

      accentColor: {
        type: String,
        default: '#C9A84C',
        trim: true,
      },

      isPaid: {
        type: Boolean,
        default: false,
        required: true,
        index: true,
      },

      priceCents: {
        type: Number,
        default: 0,
        min: 0,
      },

      currency: {
        type: String,
        enum: ['usd'],
        default: 'usd',
      },

      stripePriceId: {
        type: String,
        trim: true,
      },

      introVideo: {
        type: pillarIntroVideoSchema,
        default: () => ({
          status: 'not_uploaded',
        }),
      },

      order: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 3,
      },

      status: {
        type: String,
        enum: PILLAR_STATUSES,
        default: 'draft',
        index: true,
      },

      publishedAt: {
        type: Date,
      },

      archivedAt: {
        type: Date,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: true,
      collection: 'challengepillars',
    }
  );

challengePillarSchema.index({
  status: 1,
  order: 1,
});

challengePillarSchema.index({
  isPaid: 1,
  status: 1,
});

export const ChallengePillar =
  model<IChallengePillar>(
    'ChallengePillar',
    challengePillarSchema
  );