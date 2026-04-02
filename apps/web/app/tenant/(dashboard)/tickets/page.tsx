"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ticketService,
  type Ticket,
  type ListTicketsParams,
} from "@/lib/services/ticket.service";
import { toast } from "sonner";
import { useTicketRealtime } from "@/hooks/use-ticket-realtime";

import {
  TicketSidebar,
  views,
  type ViewKey,
} from "@/components/tickets/ticket-sidebar";
import { TicketListHeader } from "@/components/tickets/ticket-list-header";
import { TicketListContent } from "@/components/tickets/ticket-list-content";

export default function TicketsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey>("unsolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real-time: auto-refresh when new tickets/replies arrive via WebSocket
  useTicketRealtime({
    onNewTicket: () => fetchTickets(),
    onTicketUpdated: () => fetchTickets(),
    onTicketReply: () => fetchTickets(),
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: ListTicketsParams = {
        view: activeView,
      };
      const data = await ticketService.list(params);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [activeView]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const viewLabel = views.find((v) => v.key === activeView)?.label ?? "Tickets";

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <TicketSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TicketListHeader
          title={viewLabel}
          total={total}
          onSuccess={fetchTickets}
        />
        <TicketListContent
          loading={loading}
          tickets={tickets}
          onRowClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
        />
      </main>
    </div>
  );
}
