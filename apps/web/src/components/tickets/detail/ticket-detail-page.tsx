"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTicket, useAddComment, useUpdateTicket } from "@/hooks/use-tickets";

import { TicketDetailHeader } from "@/components/tickets/detail/ticket-detail-header";
import { TicketConversation } from "@/components/tickets/detail/ticket-conversation";
import { TicketReplyEditor } from "@/components/tickets/detail/ticket-reply-editor";
import { TicketPropertiesSidebar } from "@/components/tickets/detail/ticket-properties-sidebar";

export function TicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;

  const { data: ticket, isLoading } = useTicket(ticketId);

  const addCommentMutation = useAddComment();
  const updateTicketMutation = useUpdateTicket();

  const handleAddComment = async (body: string, isInternal: boolean) => {
    addCommentMutation.mutate(
      { ticketId, data: { body, isInternal } },
      {
        onSuccess: () => {
          toast.success(isInternal ? "Internal note added" : "Reply sent");
        },
      },
    );
  };

  const handleUpdateProperty = async (field: string, value: any) => {
    updateTicketMutation.mutate(
      { id: ticketId, data: { [field]: value } },
      {
        onSuccess: () => {
          toast.success(`Ticket ${field} updated`);
        },
      },
    );
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        Loading ticket...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <TicketDetailHeader
        subject={ticket.subject}
        ticketNumber={ticket.ticketNumber}
        status={ticket.status}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <TicketConversation ticket={ticket} />
          <TicketReplyEditor
            onAddComment={handleAddComment}
            submitting={addCommentMutation.isPending}
          />
        </div>

        <TicketPropertiesSidebar
          ticket={ticket}
          onUpdateProperty={handleUpdateProperty}
        />
      </div>
    </div>
  );
}
