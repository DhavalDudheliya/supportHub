import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { emailService } from "@/lib/services/email.service";

export function useEmailStatus() {
  return useQuery({
    queryKey: queryKeys.email.status(),
    queryFn: emailService.getStatus,
  });
}

export function useDisconnectEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.email.status() });
    },
  });
}
