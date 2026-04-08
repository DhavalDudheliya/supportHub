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

/** Check if a string contains HTML tags */
function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
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

  const htmlContent = isHtml(body);

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
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
            "rounded-lg border p-4 text-sm overflow-auto",
            isInternal
              ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/20"
              : "bg-muted/30",
          )}
        >
          {htmlContent ? (
            <div
              className="email-body prose prose-sm dark:prose-invert max-w-none break-words [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_table]:text-sm [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="whitespace-pre-wrap">{body}</p>
          )}
        </div>
      </div>
    </div>
  );
}
