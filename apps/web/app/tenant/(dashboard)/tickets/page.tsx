"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ticketService,
  type Ticket,
  type ListTicketsParams,
} from "@/lib/services/ticket.service";
import { toast } from "sonner";
import {
  User,
  Users,
  ListChecks,
  Clock,
  Ban,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@supporthub/ui/components/button";
import { Badge } from "@supporthub/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@supporthub/ui/components/table";
import { Avatar, AvatarFallback } from "@supporthub/ui/components/avatar";
import { cn } from "@supporthub/ui/lib/utils";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";

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

const priorityColors: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  URGENT:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function TicketsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewKey>("unsolved");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: ListTicketsParams = {
        view: activeView,
        page,
        limit,
      };
      const data = await ticketService.list(params);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [activeView, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const totalPages = Math.ceil(total / limit);

  const handleViewChange = (view: ViewKey) => {
    setActiveView(view);
    setPage(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <div className="flex-1 overflow-auto">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium text-primary">
                      #{ticket.ticketNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(ticket.customer?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{ticket.customer?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          priorityColors[ticket.priority],
                        )}
                      >
                        {ticket.priority.charAt(0) +
                          ticket.priority.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">{(page - 1) * limit + 1}</span>-
              <span className="font-medium">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> tickets
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
