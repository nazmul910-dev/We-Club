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
    .populate('sender', 'fullName profileImage')
    .lean();

  // reverse so oldest-first, ready to render top-to-bottom
  return messages.reverse();
};

export const createMessage = async (
  roomId: string,
  senderId: string,
  content: string
) => {
  const message = await Message.create({
    room: roomId,
    sender: senderId,
    content,
  });

  return message.populate('sender', 'fullName profileImage');
};