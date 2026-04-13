"use client";

import { useEffect, useState, useCallback } from "react";
import {
  usePendingInvitations,
  useRevokeInvitation,
} from "@/hooks/use-invitations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

import { TeamSettingsHeader } from "@/components/settings/team/team-settings-header";
import { PendingInvitationsCard } from "@/components/settings/team/pending-invitations-card";

export function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const { data: invitations = [], isLoading: loading } =
    usePendingInvitations();
  const revokeMutation = useRevokeInvitation();

  const fetchInvitations = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.invitations.pending(),
    });
  }, [queryClient]);

  const handleRevoke = (id: string) => {
    revokeMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Invitation revoked");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || "Failed to revoke invitation",
        );
      },
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 max-w-5xl mx-auto">
      <TeamSettingsHeader onInviteSuccess={fetchInvitations} />
      <PendingInvitationsCard
        invitations={invitations}
        loading={loading}
        onRevoke={handleRevoke}
      />
    </div>
  );
}
