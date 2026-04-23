"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets, useCreateTicket } from "@/hooks/use-tickets";
import { queryKeys } from "@/lib/query-keys";

import {
  TicketSidebar,
  views,
  type ViewKey,
} from "@/components/tickets/ticket-sidebar";
import { TicketListHeader } from "@/components/tickets/ticket-list-header";
import { TicketListContent } from "@/components/tickets/ticket-list-content";

export function TicketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<ViewKey>("unsolved");

  const { data, isLoading } = useTickets({ view: activeView });
  const tickets = data?.tickets || [];
  const total = data?.total || 0;

  const viewLabel = views.find((v) => v.key === activeView)?.label ?? "Tickets";

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <TicketSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TicketListHeader
          title={viewLabel}
          total={total}
          onSuccess={() => {
            /* handled by hook */
          }}
        />
        <TicketListContent
          loading={isLoading}
          tickets={tickets}
          onRowClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
        />
      </main>
    </div>
  );
}
