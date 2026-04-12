import Link from "next/link";

import { Button } from "@supporthub/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import { Skeleton } from "@supporthub/ui/components/skeleton";

import type { EmailConnectionStatus } from "@/lib/services/email.service";
import { ChannelRow } from "@/components/dashboard/channel-row";

interface EmailChannelsCardProps {
  emailStatus: EmailConnectionStatus | null;
  loading: boolean;
  connectedProviders: number;
}

export function EmailChannelsCard({
  emailStatus,
  loading,
  connectedProviders,
}: EmailChannelsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Email Channels</CardTitle>
        <CardDescription>
          Connected inboxes that can create or update tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : (
          <>
            <ChannelRow
              label="Gmail"
              connected={!!emailStatus?.gmail?.isActive}
              email={emailStatus?.gmail?.email ?? null}
            />
            <ChannelRow
              label="Outlook"
              connected={!!emailStatus?.outlook?.isActive}
              email={emailStatus?.outlook?.email ?? null}
            />
          </>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {connectedProviders} of 2 providers connected
        </span>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/settings/email" />}
        >
          Manage email
        </Button>
      </CardFooter>
    </Card>
  );
}
