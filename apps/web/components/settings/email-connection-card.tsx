"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow, format } from "date-fns";
import {
  Mail,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Unplug,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@supporthub/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import { Badge } from "@supporthub/ui/components/badge";

import type { EmailAccountStatus } from "@/lib/services/email.service";
import { emailService } from "@/lib/services/email.service";

// --- Provider Branding ---

const providerConfig = {
  GMAIL: {
    name: "Gmail",
    description: "Connect your Google Workspace or Gmail account",
    icon: (
      <Image
        src="/svgs/gmail.svg"
        alt="Gmail"
        width={24}
        height={24}
        className="h-6 w-6"
      />
    ),
    gradient: "from-red-500/10 via-blue-500/10 to-green-500/10",
    accentColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-900/30",
  },
  OUTLOOK: {
    name: "Outlook",
    description: "Connect your Microsoft 365 or Outlook account",
    icon: (
      <Image
        src="/svgs/microsoft-outlook.svg"
        alt="Outlook"
        width={24}
        height={24}
        className="h-6 w-6"
      />
    ),
    gradient: "from-blue-500/10 via-sky-500/10 to-blue-600/10",
    accentColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-900/30",
  },
} as const;

// --- Props ---

interface EmailConnectionCardProps {
  provider: "GMAIL" | "OUTLOOK";
  status: EmailAccountStatus | null;
  onStatusChange: () => void;
}

// --- Component ---

export function EmailConnectionCard({
  provider,
  status,
  onStatusChange,
}: EmailConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const config = providerConfig[provider];
  const isConnected = !!status;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const url =
        provider === "GMAIL"
          ? await emailService.getGmailConnectUrl()
          : await emailService.getOutlookConnectUrl();

      // Redirect to OAuth consent screen
      window.location.href = url;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          `Failed to initiate ${config.name} connection`,
      );
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await emailService.disconnect(
        provider.toLowerCase() as "gmail" | "outlook",
      );
      toast.success(`${config.name} account disconnected`);
      onStatusChange();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || `Failed to disconnect ${config.name}`,
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isConnected
          ? `${config.borderColor} border shadow-sm`
          : "border-dashed border-muted-foreground/25 hover:border-muted-foreground/40"
      }`}
    >
      {/* Gradient background accent */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${config.gradient} opacity-50 pointer-events-none`}
      />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Provider Icon */}
            <div className="flex h-11 w-14 items-center justify-center rounded-xl bg-background shadow-sm border">
              {config.icon}
            </div>

            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                {config.description}
              </CardDescription>
            </div>
          </div>

          {/* Status Badge */}
          {isConnected ? (
            <Badge
              variant="outline"
              className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <CircleDashed className="h-3.5 w-3.5" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        {isConnected && status ? (
          <div className="space-y-4">
            {/* Connected Account Info */}
            <div className="rounded-lg bg-background/80 border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{status.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Connected{" "}
                  {formatDistanceToNow(new Date(status.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {status.watchExpiry && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Listening for emails · Watch renews{" "}
                    {format(new Date(status.watchExpiry), "MMM d, h:mm a")}
                  </span>
                </div>
              )}
            </div>

            {/* Disconnect Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4 mr-2" />
              )}
              Disconnect {config.name}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Empty State */}
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Incoming emails will be automatically converted into support
                tickets in real time.
              </p>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect {config.name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
