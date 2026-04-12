import { Clock3, TicketCheck, TriangleAlert, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";

export type DashboardStatsData = {
  totalTickets: number;
  unsolvedTickets: number;
  unassignedTickets: number;
  totalCustomers: number;
};

interface DashboardStatsProps {
  stats: DashboardStatsData;
  loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        loading={loading}
        title="Total Tickets"
        value={stats.totalTickets}
        description="All tickets in the workspace."
        icon={TicketCheck}
      />
      <MetricCard
        loading={loading}
        title="Unsolved"
        value={stats.unsolvedTickets}
        description="Open and pending tickets that still need progress."
        icon={Clock3}
      />
      <MetricCard
        loading={loading}
        title="Unassigned"
        value={stats.unassignedTickets}
        description="Tickets waiting for an owner."
        icon={TriangleAlert}
      />
      <MetricCard
        loading={loading}
        title="Customers"
        value={stats.totalCustomers}
        description="Customer records available to your team."
        icon={Users}
      />
    </section>
  );
}
