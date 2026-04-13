"use client";

import { useMemo } from "react";

import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

import { useTickets } from "@/hooks/use-tickets";
import { useCustomersList } from "@/hooks/use-customers";
import { useEmailStatus } from "@/hooks/use-email";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardStats,
  type DashboardStatsData,
} from "@/components/dashboard/dashboard-stats";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { EmailChannelsCard } from "@/components/dashboard/email-channels-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";

const emptyStats: DashboardStatsData = {
  totalTickets: 0,
  unsolvedTickets: 0,
  unassignedTickets: 0,
  totalCustomers: 0,
};

export function DashboardOverview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allTickets, isLoading: loadingAll } = useTickets({
    view: "all",
    page: 1,
    limit: 1,
  });
  const { data: unsolvedTickets, isLoading: loadingUnsolved } = useTickets({
    view: "unsolved",
    page: 1,
    limit: 1,
  });
  const { data: unassignedTickets, isLoading: loadingUnassigned } = useTickets({
    view: "unassigned",
    page: 1,
    limit: 1,
  });
  const { data: customers, isLoading: loadingCustomers } = useCustomersList(
    1,
    1,
  );
  const { data: recentTicketsResponse, isLoading: loadingRecent } = useTickets({
    view: "recent",
    page: 1,
    limit: 5,
  });
  const { data: emailStatus, isLoading: loadingEmail } = useEmailStatus();

  const loading =
    loadingAll ||
    loadingUnsolved ||
    loadingUnassigned ||
    loadingCustomers ||
    loadingRecent ||
    loadingEmail;

  const stats: DashboardStatsData = {
    totalTickets: allTickets?.total ?? 0,
    unsolvedTickets: unsolvedTickets?.total ?? 0,
    unassignedTickets: unassignedTickets?.total ?? 0,
    totalCustomers: customers?.total ?? 0,
  };

  const recentTickets = recentTicketsResponse?.tickets ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.email.status() });
  };

  const connectedProviders = useMemo(() => {
    if (!emailStatus) {
      return 0;
    }

    return [emailStatus.gmail, emailStatus.outlook].filter(
      (account) => account?.isActive,
    ).length;
  }, [emailStatus]);

  const firstName = user?.firstName ?? "there";
  const company = user?.workspace.company ?? "your workspace";

  return (
    <div className="flex-1 space-y-6 p-8">
      <DashboardHeader
        firstName={firstName}
        company={company}
        loading={loading}
        onRefresh={handleRefresh}
      />

      <DashboardStats stats={stats} loading={loading} />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RecentTickets recentTickets={recentTickets} loading={loading} />

        <div className="grid gap-4">
          <EmailChannelsCard
            emailStatus={emailStatus ?? null}
            loading={loading}
            connectedProviders={connectedProviders}
          />

          <QuickActionsCard />
        </div>
      </section>
    </div>
  );
}
