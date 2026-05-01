"use client";

import {
  usePendingInvitations,
  useRevokeInvitation,
  useTeamAgents,
} from "@/hooks/use-invitations";
import { toast } from "sonner";

import { TeamSettingsHeader } from "@/components/settings/team/team-settings-header";
import { PendingInvitationsCard } from "@/components/settings/team/pending-invitations-card";
import { TeamAgentsCard } from "@/components/settings/team/team-agents-card";

export function TeamSettingsPage() {
  const { data: invitations = [], isLoading: loading } =
    usePendingInvitations();
  const { data: agents = [], isLoading: loadingAgents } = useTeamAgents();
  const revokeMutation = useRevokeInvitation();

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
      <TeamSettingsHeader />
      <TeamAgentsCard agents={agents} loading={loadingAgents} />
      <PendingInvitationsCard
        invitations={invitations}
        loading={loading}
        onRevoke={handleRevoke}
      />
    </div>
  );
}
