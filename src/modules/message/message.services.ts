import { Types } from "mongoose";
import { Message } from "./message.model";

export const getMessageHistory = async (
  roomId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "fullName profileImage")
    .populate({
      path: "replyTo",
      select: "content sender isDeleted",
      populate: { path: "sender", select: "fullName" },
    })
    .lean();

  return messages.reverse();
};

export const createMessage = async (
  roomId: string,
  senderId: string,
  content: string,
  replyTo?: string | null
) => {

  if (replyTo) {
    const parent = await Message.findOne({ _id: replyTo, room: roomId });
    if (!parent) {
      throw new Error("Message you're replying to no longer exists in this room");
    }
  }


  const message = await Message.create({
    room: roomId,
    sender: senderId,
    content,
    replyTo: replyTo || null,
  });

  return message.populate([
    { path: "sender", select: "fullName profileImage" },
    {
      path: "replyTo",
      select: "content sender isDeleted",
      populate: { path: "sender", select: "fullName" },
    },
  ]);
};

export const deleteMessage = async (messageId: string, userId: string) => {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new Error("Invalid message id");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  // soft delete — keeps the message row so reply-chains and room history don't break
  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = "This message was deleted";
  await message.save();

  return message;
};