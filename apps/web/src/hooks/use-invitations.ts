import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { invitationService } from "@/lib/services/invitation.service";

export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.pending(),
    queryFn: invitationService.getPendingInvitations,
  });
}

export function useInviteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invitationService.inviteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.pending(),
      });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invitationService.revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.pending(),
      });
    },
  });
}
