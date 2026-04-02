"use client";

import { type Ticket, type TicketComment } from "@/lib/services/ticket.service";
import { TicketCommentItem } from "./ticket-comment-item";

interface TicketConversationProps {
  ticket: Ticket;
}

export function TicketConversation({ ticket }: TicketConversationProps) {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Initial ticket message */}
      <TicketCommentItem
        authorName={ticket.customer?.name || "?"}
        createdAt={ticket.createdAt}
        body={ticket.description}
      />

      {/* Comments */}
      {ticket.comments?.map((comment: TicketComment) => (
        <TicketCommentItem
          key={comment.id}
          authorName={
            `${comment.author?.firstName ?? ""} ${
              comment.author?.lastName ?? ""
            }`.trim() || "Unknown"
          }
          createdAt={comment.createdAt}
          body={comment.body}
          isInternal={comment.isInternal}
        />
      ))}
    </div>
  );
}
