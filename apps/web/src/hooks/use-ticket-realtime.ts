/**
 * useTicketRealtime — Real-Time Ticket Event Hook
 *
 * Subscribes to Socket.IO `ticket:*` events for the current workspace.
 * Shows toast notifications for new tickets from email and triggers
 * a callback so the parent component can refresh its ticket list.
 *
 * Usage:
 *   useTicketRealtime({
 *     onNewTicket: (ticket) => { refetch(); },
 *     onTicketUpdated: (data) => { refetch(); },
 *     onTicketReply: (data) => { refetch(); },
 *   });
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Socket } from "socket.io-client";

interface TicketCreatedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    status: string;
    priority: string;
    source: string;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
  };
}

interface TicketReplyPayload {
  ticketId: string;
  reply: {
    body: string;
    source: string;
    customerId: string;
    createdAt: string;
  };
  reopened: boolean;
}

interface TicketUpdatedPayload {
  ticketId: string;
  changes: Record<string, unknown>;
}

interface UseTicketRealtimeOptions {
  /** Called when a new ticket is created (from email or otherwise) */
  onNewTicket?: (data: TicketCreatedPayload) => void;
  /** Called when a ticket is updated (status, assignment, etc.) */
  onTicketUpdated?: (data: TicketUpdatedPayload) => void;
  /** Called when a reply is added to a ticket (email thread continuation) */
  onTicketReply?: (data: TicketReplyPayload) => void;
  /** Set to false to disable the hook (e.g., when on a different page) */
  enabled?: boolean;
}

export function useTicketRealtime(options: UseTicketRealtimeOptions = {}): {
  socket: Socket | null;
  disconnect: () => void;
} {
  const {
    onNewTicket,
    onTicketUpdated,
    onTicketReply,
    enabled = true,
  } = options;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  // Use refs for callbacks to avoid re-subscribing on every render
  const callbacksRef = useRef({ onNewTicket, onTicketUpdated, onTicketReply });
  callbacksRef.current = { onNewTicket, onTicketUpdated, onTicketReply };

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Only connect on the client
    if (typeof window === "undefined") return;

    const socket = getSocket();
    socketRef.current = socket;

    // --- Event Handlers ---

    const handleTicketCreated = (data: TicketCreatedPayload) => {
      // Invalidate ticket queries to refetch globally
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });

      // Show toast for email-sourced tickets
      if (data.ticket.source === "EMAIL") {
        toast.info(`New ticket from email`, {
          description: `#${data.ticket.ticketNumber} — ${data.ticket.subject}`,
          duration: 6000,
        });
      }
      callbacksRef.current.onNewTicket?.(data);
    };

    const handleTicketUpdated = (data: TicketUpdatedPayload) => {
      // Avoid a full re-fetch if we already have the optimistic update,
      // but invalidating the list is generally safe here.
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });

      callbacksRef.current.onTicketUpdated?.(data);
    };

    const handleTicketReply = (data: TicketReplyPayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });

      if (data.reopened) {
        toast.info("Ticket reopened", {
          description: "A customer replied to a resolved ticket.",
          duration: 5000,
        });
      }
      callbacksRef.current.onTicketReply?.(data);
    };

    // Subscribe
    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:reply", handleTicketReply);

    // Cleanup
    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:reply", handleTicketReply);
    };
  }, [enabled, isAuthenticated]);

  return {
    /** The underlying socket instance, if connected */
    socket: socketRef.current,
    /** Manually disconnect the socket */
    disconnect: disconnectSocket,
  };
}
