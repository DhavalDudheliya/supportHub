"use client";

import { type Ticket } from "@/lib/services/ticket.service";
import { Avatar, AvatarFallback } from "@supporthub/ui/components/avatar";
import { Badge } from "@supporthub/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@supporthub/ui/components/select";

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statusOptions = ["OPEN", "PENDING", "SOLVED", "CLOSED"];

interface TicketPropertiesSidebarProps {
  ticket: Ticket;
  onUpdateProperty: (field: string, value: any) => Promise<void>;
}

export function TicketPropertiesSidebar({
  ticket,
  onUpdateProperty,
}: TicketPropertiesSidebarProps) {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  };

  return (
    <aside className="w-80 shrink-0 overflow-auto border-l border-border p-5 space-y-6">
      {/* Requester */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Requester
        </p>
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(ticket.customer?.name || "?")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {ticket.customer?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {ticket.customer?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Properties
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select
              value={ticket.status}
              onValueChange={(value) => onUpdateProperty("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Priority</label>
            <Select
              value={ticket.priority}
              onValueChange={(value) => onUpdateProperty("priority", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Assignee</label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {ticket.assignee ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(
                        `${ticket.assignee.firstName ?? ""} ${
                          ticket.assignee.lastName ?? ""
                        }`.trim() || "?",
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {ticket.assignee.firstName ?? ""}{" "}
                  {ticket.assignee.lastName ?? ""}
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ticket.tags?.length ? (
            ticket.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No tags</p>
          )}
        </div>
      </div>
    </aside>
  );
}
