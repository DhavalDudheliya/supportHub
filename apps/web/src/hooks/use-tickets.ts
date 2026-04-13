import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  ticketService,
  type ListTicketsParams,
  type Ticket,
} from "@/lib/services/ticket.service";

export function useTickets(params: ListTicketsParams) {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: () => ticketService.list(params),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketService.get(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketService.create,
    onSuccess: () => {
      // Invalidate all ticket lists so they refetch to include the new ticket
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof ticketService.update>[1];
    }) => ticketService.update(id, data),
    // Optimistic update for UI responsiveness
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.tickets.detail(id),
      });

      // Snapshot the previous value
      const previousTicket = queryClient.getQueryData<Ticket>(
        queryKeys.tickets.detail(id),
      );

      // Optimistically update to the new value
      if (previousTicket) {
        queryClient.setQueryData<Ticket>(queryKeys.tickets.detail(id), {
          ...previousTicket,
          ...data,
        } as Ticket);
      }

      // Return a context object with the snapshotted value
      return { previousTicket, id };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTicket, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(
          queryKeys.tickets.detail(context.id),
          context.previousTicket,
        );
      }
    },
    // Always refetch after error or success to ensure server sync
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(variables.id),
      });
      // Invalidate lists too since status/priority might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketService.delete,
    onSuccess: (_, id) => {
      // Remove detail from cache
      queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(id) });
      // Refresh lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: Parameters<typeof ticketService.addComment>[1];
    }) => ticketService.addComment(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      // Invalidate the detail query to fetch the updated comments and count
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(ticketId),
      });
    },
  });
}
