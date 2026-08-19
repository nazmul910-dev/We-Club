import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import config from "../config";
import { User } from "../modules/users/users.model.schema";
import { getGeneralRoom } from "../modules/room/room.service";
import { createMessage, deleteMessage } from "../modules/message/message.services";

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  accessTo?: string;
}

export let io: Server;

const getUserRoom = (userId: string): string => `user:${userId}`;

export const emitNotificationToUser = (
  userId: string,
  payload: unknown,
): void => {
  if (!io) {
    return;
  }

  io.to(getUserRoom(userId)).emit("notification:new", payload);
};

// userId -> set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // authenticate every socket using the same JWT used for REST (Bearer token)
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    try {
      const decoded = jwt.verify(
        token,
        config.JWT_ACCESS_SECRET as jwt.Secret,
      ) as DecodedToken;

      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token payload"));
      }

      socket.data.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    try {
      const userId = socket.data.user.id as string;

      // fetch display info once per connection so events don't need extra queries
      const userDoc = await User.findById(userId).select(
        "fullName profileImage",
      );


      socket.data.user.fullName = userDoc?.fullName ?? "Unknown";
      socket.data.user.profileImage = userDoc?.profileImage ?? null;
      // auto-join the single General room for now (explicit joinRoom comes later)
      const room = await getGeneralRoom(userId);
      const roomId = room._id.toString();
      socket.data.roomId = roomId;
      socket.join(roomId);

      // track presence
      const isFirstConnectionForUser = !onlineUsers.has(userId);
      if (isFirstConnectionForUser) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      if (isFirstConnectionForUser) {
        socket.to(roomId).emit("presence:update", { userId, online: true });
      }

      // send the current online users list to the newly connected socket only
      socket.emit("presence:list", Array.from(onlineUsers.keys()));

      // console.log(`Socket connected: ${socket.id} (user: ${userId})`);

      // socket.on("message:send", async (content: string) => {
      //   try {
      //     if (!content || !content.trim()) return;

      //     const message = await createMessage(roomId, userId, content.trim());
      //     io.to(roomId).emit("message:new", message);
      //   } catch (error) {
      //     socket.emit("error", "Failed to send message");
      //   }
      // });
      socket.on(
        "message:send",
        async (payload: { content: string; replyTo?: string | null }) => {
          try {
            const content = payload?.content;
            if (!content || !content.trim()) return;

            const message = await createMessage(
              roomId,
              userId,
              content.trim(),
              payload?.replyTo ?? null
            );

            io.to(roomId).emit("message:new", message);
          } catch (error: any) {
            console.error("message:send error:", error);
            socket.emit("error", error.message || "Failed to send message");
          }
        }
      );

      socket.on("message:delete", async (messageId: string) => {
        try {
          if (!messageId) return;

          const deleted = await deleteMessage(messageId, userId);

          // broadcast to everyone in the room (including sender) so all clients update in sync
          io.to(roomId).emit("message:deleted", {
            messageId: deleted._id.toString(),
            content: deleted.content, // "This message was deleted"
          });
        } catch (error: any) {
          console.error("message:delete error:", error);
          socket.emit("error", error.message || "Failed to delete message");
        }
      });

      socket.on("typing:start", () => {
        socket.to(roomId).emit("typing:update", {
          userId,
          fullName: socket.data.user.fullName,
          typing: true,
        });
      });

      socket.on("typing:stop", () => {
        socket.to(roomId).emit("typing:update", {
          userId,
          fullName: socket.data.user.fullName,
          typing: false,
        });
      });

      socket.on("disconnect", () => {
        const userSockets = onlineUsers.get(userId);
        userSockets?.delete(socket.id);

        if (userSockets && userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.to(roomId).emit("presence:update", { userId, online: false });
        }

        console.log(`Socket disconnected: ${socket.id}`);
      });
    } catch (error) {
      console.error("Socket connection error:", error);
      socket.disconnect();
    }
  });

  return io;
};
