"use client";

import { useMemo, useState } from "react";
import { BarChart3, Clock, TicketCheck, TrendingUp } from "lucide-react";

import {
  useReportsOverview,
  useTicketVolume,
  useStatusBreakdown,
  useAgentPerformance,
  useTagDistribution,
} from "@/hooks/use-reports";

import { MetricCard } from "@/components/shared/metric-card";
import {
  DateRangeFilter,
  presetToRange,
  type DatePreset,
} from "./date-range-filter";
import { VolumeChart } from "./volume-chart";
import { StatusChart } from "./status-chart";
import { AgentChart } from "./agent-chart";
import { TagsChart } from "./tags-chart";

function formatPresetLabel(preset: DatePreset): string {
  const map: Record<string, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    "24h": "24 hours",
  };
  return map[preset] || preset;
}

export function ReportingPage() {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const { from, to } = useMemo(() => presetToRange(preset), [preset]);

  const { data: overview, isLoading: loadingOverview } = useReportsOverview(
    from,
    to,
  );
  const { data: volume, isLoading: loadingVolume } = useTicketVolume(from, to);
  const { data: statusData, isLoading: loadingStatus } = useStatusBreakdown(
    from,
    to,
  );
  const { data: agentData, isLoading: loadingAgents } = useAgentPerformance(
    from,
    to,
  );
  const { data: tagData, isLoading: loadingTags } = useTagDistribution(
    from,
    to,
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporting</h1>
          <p className="text-muted-foreground text-sm">
            Insights and analytics for your support operations.
          </p>
        </div>
        <DateRangeFilter activePreset={preset} onPresetChange={setPreset} />
      </div>

      {/* Summary stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          loading={loadingOverview}
          title="Total Tickets"
          value={overview?.total ?? 0}
          description={`In the last ${formatPresetLabel(preset)}`}
          icon={TicketCheck}
        />
        <MetricCard
          loading={loadingOverview}
          title="Open"
          value={overview?.open ?? 0}
          description="Tickets awaiting action"
          icon={TrendingUp}
        />
        <MetricCard
          loading={loadingOverview}
          title="Solved"
          value={overview?.solved ?? 0}
          description="Resolved in this period"
          icon={BarChart3}
        />
        <MetricCard
          loading={loadingOverview}
          title="Avg. Resolution"
          value={
            typeof overview?.avgResolutionHours === "number"
              ? `${overview.avgResolutionHours}h`
              : "—"
          }
          description="Average time to close"
          icon={Clock}
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <VolumeChart data={volume} loading={loadingVolume} />
        <StatusChart data={statusData} loading={loadingStatus} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AgentChart data={agentData} loading={loadingAgents} />
        <TagsChart data={tagData} loading={loadingTags} />
      </section>
    </div>
  );
}
