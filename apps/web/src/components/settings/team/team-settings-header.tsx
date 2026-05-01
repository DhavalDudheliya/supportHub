import { Users } from "lucide-react";
import { InviteAgentDialog } from "@/components/team/invite-agent-dialog";

export function TeamSettingsHeader() {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <h2 className="text-3xl flex items-center gap-2 font-bold tracking-tight">
          <Users className="h-8 w-8 text-primary" />
          Team Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage your incoming agents and sent invitations.
        </p>
      </div>
      <div>
        <InviteAgentDialog />
      </div>
    </div>
  );
}
