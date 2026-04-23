"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@supporthub/ui/components/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import { Skeleton } from "@supporthub/ui/components/skeleton";
import type { AgentPerformanceItem } from "@/lib/services/reports.service";

const chartConfig = {
  count: {
    label: "Tickets",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig;

interface AgentChartProps {
  data: AgentPerformanceItem[] | undefined;
  loading: boolean;
}

export function AgentChart({ data, loading }: AgentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Performance</CardTitle>
        <CardDescription>Tickets handled per agent</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Skeleton className="h-[250px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No assigned tickets in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
              accessibilityLayer
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={100}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
