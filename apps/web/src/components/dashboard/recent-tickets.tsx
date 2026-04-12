import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TicketCheck } from "lucide-react";

import { Badge } from "@supporthub/ui/components/badge";
import { Button } from "@supporthub/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@supporthub/ui/components/empty";
import { Skeleton } from "@supporthub/ui/components/skeleton";

import type { Ticket } from "@/lib/services/ticket.service";

interface RecentTicketsProps {
  recentTickets: Ticket[];
  loading: boolean;
}

function statusTone(status: Ticket["status"]) {
  switch (status) {
    case "OPEN":
      return "default";
    case "PENDING":
      return "secondary";
    case "SOLVED":
      return "outline";
    case "CLOSED":
      return "ghost";
    default:
      return "outline";
  }
}

export function RecentTickets({ recentTickets, loading }: RecentTicketsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Ticket Activity</CardTitle>
        <CardDescription>
          The latest ticket updates across your workspace.
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/tickets" />}
          >
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        ) : recentTickets.length === 0 ? (
          <Empty className="border border-dashed py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TicketCheck className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>No tickets yet</EmptyTitle>
              <EmptyDescription>
                When tickets start coming in, the newest activity will show up
                here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          recentTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      #{ticket.ticketNumber}
                    </span>
                    <Badge variant={statusTone(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {ticket.subject}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.customer.name} • {ticket.customer.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground lg:text-right">
                  <p>
                    Updated{" "}
                    {formatDistanceToNow(new Date(ticket.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p>
                    {ticket.assignee
                      ? `Assigned to ${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                      : "No assignee yet"}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
