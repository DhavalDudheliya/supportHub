/**
 * Socket.IO Client — Singleton
 *
 * Connects to the backend WebSocket server for real-time events.
 * Automatically authenticates using the JWT access token during handshake.
 * Joins the workspace room so events are scoped to the correct tenant.
 *
 * Usage:
 *   import { getSocket, disconnectSocket } from "@/lib/socket";
 *   const socket = getSocket();
 *   socket.on("ticket:created", (data) => { ... });
 */

import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./token";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Get or create the Socket.IO client singleton.
 * The connection is lazily initialized on first call.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getAccessToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.IO] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket.IO] Connection error:", error.message);
  });

  return socket;
}

/**
 * Disconnect and clean up the socket instance.
 * Call this on logout or when the auth context is destroyed.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
