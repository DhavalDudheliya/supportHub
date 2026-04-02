"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@supporthub/ui/components/avatar";
import { Badge } from "@supporthub/ui/components/badge";
import { cn } from "@supporthub/ui/lib/utils";

interface TicketCommentItemProps {
  authorName: string;
  createdAt: string | Date;
  body: string;
  isInternal?: boolean;
}

export function TicketCommentItem({
  authorName,
  createdAt,
  body,
  isInternal,
}: TicketCommentItemProps) {
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
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(createdAt), "MMM d, h:mm a")}
          </span>
          {isInternal && (
            <Badge
              variant="outline"
              className="text-[10px] border-yellow-500 text-yellow-600 dark:text-yellow-400"
            >
              INTERNAL NOTE
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            isInternal
              ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/20"
              : "bg-muted/30",
          )}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
