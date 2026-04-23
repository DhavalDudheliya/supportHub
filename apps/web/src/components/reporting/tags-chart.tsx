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
import type { TagDistributionItem } from "@/lib/services/reports.service";

const CATEGORY_COLORS: Record<string, string> = {
  ISSUE_TYPE: "hsl(217, 91%, 60%)",
  DEPARTMENT: "hsl(142, 71%, 45%)",
  PRODUCT_AREA: "hsl(262, 83%, 58%)",
  SENTIMENT: "hsl(38, 92%, 50%)",
  SLA: "hsl(0, 72%, 51%)",
};

const chartConfig = {
  count: {
    label: "Tickets",
    color: "hsl(262, 83%, 58%)",
  },
} satisfies ChartConfig;

interface TagsChartProps {
  data: TagDistributionItem[] | undefined;
  loading: boolean;
}

export function TagsChart({ data, loading }: TagsChartProps) {
  // Enrich with color
  const coloredData = data?.map((item) => ({
    ...item,
    fill: CATEGORY_COLORS[item.category] ?? "hsl(220, 9%, 46%)",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Tags</CardTitle>
        <CardDescription>Most common ticket tags</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !coloredData ? (
          <Skeleton className="h-[250px] w-full" />
        ) : coloredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No tagged tickets in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              data={coloredData}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
