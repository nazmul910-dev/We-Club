import { Schema, model } from "mongoose";

import { IMessage } from "./message.interface";

const messageSchema = new Schema<IMessage>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

export const Message = model<IMessage>("Message", messageSchema);
