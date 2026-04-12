import { MetricCard } from "@/components/shared/metric-card";

export type CustomersStatsData = {
  total: number;
  withPhone: number;
  addedThisWeek: number;
};

interface CustomersStatsProps {
  stats: CustomersStatsData;
}

export function CustomersStats({ stats }: CustomersStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Total Customers"
        value={stats.total}
        description="Active customer records in this workspace."
        className=""
        headerClassName="pb-3"
      />

      <MetricCard
        title="Visible With Phone"
        value={stats.withPhone}
        description="Loaded customers with a phone number on file."
        className=""
        headerClassName="pb-3"
      />

      <MetricCard
        title="Added This Week"
        value={stats.addedThisWeek}
        description="Customers added in the last 7 days."
        className=""
        headerClassName="pb-3"
      />
    </div>
  );
}
