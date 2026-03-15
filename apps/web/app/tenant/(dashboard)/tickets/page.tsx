"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ticketService,
  type Ticket,
  type ListTicketsParams,
} from "@/lib/services/ticket.service";
import { toast } from "sonner";
import { User, Users, ListChecks, Clock, Ban, Trash2 } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { DataTable } from "@supporthub/ui/components/data-table";
import { columns } from "@/components/tickets/ticket-columns";

const views = [
  { key: "unsolved", label: "Your unsolved", icon: User },
  { key: "unassigned", label: "Unassigned", icon: Users },
  { key: "all", label: "All unsolved", icon: ListChecks },
  { key: "recent", label: "Recently updated", icon: Clock },
] as const;

const otherViews = [
  { key: "suspended", label: "Suspended", icon: Ban },
  { key: "trash", label: "Trash", icon: Trash2 },
] as const;

type ViewKey = (typeof views)[number]["key"];

export default function TicketsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey>("unsolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const handleViewChange = (view: ViewKey) => {
    setActiveView(view);
  };

  const viewLabel = views.find((v) => v.key === activeView)?.label ?? "Tickets";

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-muted/30 p-4">
        <nav className="space-y-1">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.key;
            return (
              <button
                key={view.key}
                onClick={() => handleViewChange(view.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{view.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Others
          </p>
          <nav className="space-y-1">
            {otherViews.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.key}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{view.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">{viewLabel} tickets</h1>
            <p className="text-sm text-muted-foreground">
              Showing {total} ticket{total !== 1 ? "s" : ""}
            </p>
          </div>
          <CreateTicketDialog onSuccess={fetchTickets} />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center p-12 text-muted-foreground">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <ListChecks className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No tickets found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no tickets matching this view.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tickets}
              onRowClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
