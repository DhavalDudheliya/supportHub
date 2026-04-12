import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@supporthub/ui/components/button";

import { RefreshButton } from "@/components/shared/refresh-button";

interface DashboardHeaderProps {
  firstName: string;
  company: string;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  firstName,
  company,
  loading,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <section className="rounded-3xl border border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_35%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.8))] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s what needs attention across {company} right now, with
              the fastest routes back into tickets, customers, and email
              operations.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <RefreshButton onClick={onRefresh} disabled={loading} />
          <Button nativeButton={false} render={<Link href="/tickets" />}>
            Open Tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
