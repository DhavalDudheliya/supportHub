"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import {
  emailService,
  type EmailConnectionStatus,
} from "@/lib/services/email.service";
import { customerService } from "@/lib/services/customer.service";
import { ticketService, type Ticket } from "@/lib/services/ticket.service";

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
  const [stats, setStats] = useState<DashboardStatsData>(emptyStats);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [emailStatus, setEmailStatus] = useState<EmailConnectionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        allTickets,
        unsolvedTickets,
        unassignedTickets,
        customers,
        recentTicketsResponse,
        emailConnectionStatus,
      ] = await Promise.all([
        ticketService.list({ view: "all", page: 1, limit: 1 }),
        ticketService.list({ view: "unsolved", page: 1, limit: 1 }),
        ticketService.list({ view: "unassigned", page: 1, limit: 1 }),
        customerService.list(1, 1),
        ticketService.list({ view: "recent", page: 1, limit: 5 }),
        emailService.getStatus(),
      ]);

      setStats({
        totalTickets: allTickets.total,
        unsolvedTickets: unsolvedTickets.total,
        unassignedTickets: unassignedTickets.total,
        totalCustomers: customers.total,
      });
      setRecentTickets(recentTicketsResponse.tickets);
      setEmailStatus(emailConnectionStatus);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        onRefresh={fetchDashboardData}
      />

      <DashboardStats stats={stats} loading={loading} />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RecentTickets recentTickets={recentTickets} loading={loading} />

        <div className="grid gap-4">
          <EmailChannelsCard
            emailStatus={emailStatus}
            loading={loading}
            connectedProviders={connectedProviders}
          />

          <QuickActionsCard />
        </div>
      </section>
    </div>
  );
}
