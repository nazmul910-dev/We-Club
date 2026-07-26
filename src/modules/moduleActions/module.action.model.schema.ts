import {
  model,
  Schema,
} from "mongoose";

import {
  IModuleAction,
  MODULE_ACTION_STATUSES,
} from "./module.action.interface";

const moduleActionSchema =
  new Schema<IModuleAction>(
    {
      module: {
        type: Schema.Types.ObjectId,
        ref: "CourseModule",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 5000,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      isRequired: {
        type: Boolean,
        default: true,
        required: true,
      },

      pointsReward: {
        type: Number,
        default: 5,
        min: 0,
      },

      status: {
        type: String,
        enum: MODULE_ACTION_STATUSES,
        default: "draft",
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
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      collection: "moduleactions",
    }
  );

moduleActionSchema.index(
  {
    module: 1,
    order: 1,
  },
  {
    unique: true,
  }
);

moduleActionSchema.index({
  module: 1,
  status: 1,
  order: 1,
});

moduleActionSchema.index({
  module: 1,
  isRequired: 1,
  status: 1,
});

export const ModuleAction =
  model<IModuleAction>(
    "ModuleAction",
    moduleActionSchema
  );