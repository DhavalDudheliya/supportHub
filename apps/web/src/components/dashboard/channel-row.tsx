import { Mail } from "lucide-react";
import { Badge } from "@supporthub/ui/components/badge";

interface ChannelRowProps {
  label: string;
  connected: boolean;
  email: string | null;
}

export function ChannelRow({ label, connected, email }: ChannelRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-muted p-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {email ?? "Not connected"}
          </p>
        </div>
      </div>

      <Badge variant={connected ? "default" : "outline"}>
        {connected ? "Connected" : "Disconnected"}
      </Badge>
    </div>
  );
}
