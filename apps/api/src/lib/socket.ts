/**
 * Socket.IO Server
 *
 * Initializes a Socket.IO server attached to the Express HTTP server.
 * Uses JWT authentication on handshake and workspace-scoped rooms
 * so that each workspace receives only its own events.
 *
 * Events emitted:
 *  - ticket:created  — A new ticket was created from an inbound email
 *  - ticket:updated  — An existing ticket was updated (e.g., reopened)
 *  - ticket:reply    — A new reply was added to an existing ticket
 */

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import logger from "./logger.js";

let io: Server;

/**
 * Initialize Socket.IO and attach to the HTTP server.
 * Must be called once during server startup.
 */
export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // --- JWT Authentication Middleware ---
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    if (typeof token !== "string") {
      return next(new Error("Invalid token format"));
    }

    try {
      // Strip "Bearer " prefix if present
      const rawToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      const payload = verifyAccessToken(rawToken);

      if (!payload.workspaceId) {
        return next(new Error("Invalid token: workspaceId missing"));
      }

      // Attach user data to the socket for later use
      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
        workspaceId: payload.workspaceId,
        role: payload.role,
      };

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // --- Connection Handler ---
  io.on("connection", (socket: Socket) => {
    const { workspaceId, userId } = socket.data.user;

    // Auto-join the workspace room
    const room = `workspace:${workspaceId}`;
    socket.join(room);

    logger.info(
      { userId, workspaceId, socketId: socket.id },
      "Client connected to workspace room",
    );

    socket.on("disconnect", () => {
      logger.info(
        { userId, workspaceId, socketId: socket.id },
        "Client disconnected",
      );
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

/**
 * Emit a ticket-related event to all clients in a workspace room.
 */
export function emitTicketEvent(
  workspaceId: string,
  event: "ticket:created" | "ticket:updated" | "ticket:reply",
  data: unknown,
): void {
  if (!io) {
    logger.warn("Socket.IO not initialized — skipping emit");
    return;
  }
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocketIO first.");
  }
  return io;
}
