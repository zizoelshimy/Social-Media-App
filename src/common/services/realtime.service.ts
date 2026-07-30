import type { Server } from "socket.io";

class RealtimeService {
  private io?: Server;

  initialize(io: Server) {
    this.io = io;
    this.io.on("connection", (socket) => {
      socket.emit("connected", { message: "Socket connected" });
      socket.on("join:user", (userId: string) => {
        if (userId) {
          socket.join(`user:${userId}`);
        }
      });
      socket.on("join:post", (postId: string) => {
        if (postId) {
          socket.join(`post:${postId}`);
        }
      });
    });
  }

  emit(event: string, payload: unknown) {
    this.io?.emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }

  emitToPost(postId: string, event: string, payload: unknown) {
    this.io?.to(`post:${postId}`).emit(event, payload);
  }
}

export const realtimeService = new RealtimeService();
