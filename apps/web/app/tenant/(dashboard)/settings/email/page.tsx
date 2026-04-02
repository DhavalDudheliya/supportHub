"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, RefreshCw, Inbox } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@supporthub/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";

import { EmailConnectionCard } from "@/components/settings/email-connection-card";
import {
  emailService,
  type EmailConnectionStatus,
} from "@/lib/services/email.service";

export default function EmailSettingsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<EmailConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await emailService.getStatus();
      setStatus(data);
    } catch {
      toast.error("Failed to load email connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Show toast based on OAuth callback query params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "gmail") {
      toast.success("Gmail account connected successfully!", {
        description: "Incoming emails will now create support tickets.",
      });
    } else if (connected === "outlook") {
      toast.success("Outlook account connected successfully!", {
        description: "Incoming emails will now create support tickets.",
      });
    } else if (error) {
      const message = error.includes("gmail")
        ? "Failed to connect Gmail account"
        : "Failed to connect Outlook account";
      toast.error(message, {
        description: "Please try again. Check the console for details.",
      });
    }
  }, [searchParams]);

  const connectedCount = [status?.gmail, status?.outlook].filter(
    Boolean,
  ).length;

  return (
    <div className="flex-1 space-y-6 p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-3xl flex items-center gap-2 font-bold tracking-tight">
            <Mail className="h-8 w-8 text-primary" />
            Email Integration
          </h2>
          <p className="text-muted-foreground mt-2">
            Connect your email accounts to automatically convert inbound emails
            into support tickets.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* How It Works Info Card */}
      <Card className="bg-primary/5 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-5 w-5 text-primary" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                1
              </span>
              <span>Connect your Gmail or Outlook account via OAuth</span>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                2
              </span>
              <span>
                Inbound emails are automatically detected in real time
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                3
              </span>
              <span>
                Emails become tickets; replies thread into existing tickets
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Cards */}
      {loading && !status ? (
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading email connections...
        </div>
      ) : (
        <>
          {/* Summary */}
          <p className="text-sm text-muted-foreground">
            {connectedCount === 0
              ? "No email accounts connected yet."
              : `${connectedCount} email account${connectedCount > 1 ? "s" : ""} connected.`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmailConnectionCard
              provider="GMAIL"
              status={status?.gmail ?? null}
              onStatusChange={fetchStatus}
            />
            <EmailConnectionCard
              provider="OUTLOOK"
              status={status?.outlook ?? null}
              onStatusChange={fetchStatus}
            />
          </div>
        </>
      )}
    </div>
  );
}
