import { Room } from "./room.modal";


export const getGeneralRoom = async (userId: string) => {
  let room = await Room.findOne({ name: 'General' });

  if (!room) {
    room = await Room.create({
      name: 'General',
      description: 'General discussion for everyone',
      members: [userId],
      createdBy: userId,
    });
  }

  return room;
};