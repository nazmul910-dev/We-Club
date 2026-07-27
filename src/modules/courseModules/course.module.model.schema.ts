import { Schema, model } from 'mongoose';

import {
  COURSE_MODULE_STATUSES,
  ICourseModule,
} from './course.module.interface';

const courseModuleSchema =
  new Schema<ICourseModule>(
    {
      pillar: {
        type: Schema.Types.ObjectId,
        ref: 'ChallengePillar',
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 200,
      },

      shortDescription: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
      },

      moduleNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      estimatedDurationMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },

      minimumVideoPercent: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },

      minimumActionPercent: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },

      minimumQuizScore: {
        type: Number,
        default: 70,
        min: 1,
        max: 100,
      },

      maximumQuizAttempts: {
        type: Number,
        default: 2,
        min: 1,
        max: 10,
      },

      completionPoints: {
        type: Number,
        default: 20,
        min: 0,
      },

      status: {
        type: String,
        enum: COURSE_MODULE_STATUSES,
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
      collection: 'coursemodules',
    }
  );

courseModuleSchema.index(
  {
    pillar: 1,
    moduleNumber: 1,
  },
  {
    unique: true,
  }
);

courseModuleSchema.index(
  {
    pillar: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

courseModuleSchema.index({
  pillar: 1,
  status: 1,
  moduleNumber: 1,
});

export const CourseModule =
  model<ICourseModule>(
    'CourseModule',
    courseModuleSchema
  );