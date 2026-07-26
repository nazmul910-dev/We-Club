import { Schema, model } from 'mongoose';

import { IRoom } from './room.interface';

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Room = model<IRoom>('Room', roomSchema);