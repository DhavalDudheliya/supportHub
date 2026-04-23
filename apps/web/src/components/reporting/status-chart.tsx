"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, Label } from "recharts";
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
import type { StatusBreakdownItem } from "@/lib/services/reports.service";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "hsl(217, 91%, 60%)", // blue
  PENDING: "hsl(38, 92%, 50%)", // amber
  SOLVED: "hsl(142, 71%, 45%)", // green
  CLOSED: "hsl(220, 9%, 46%)", // gray
};

const chartConfig = {
  OPEN: { label: "Open", color: STATUS_COLORS.OPEN },
  PENDING: { label: "Pending", color: STATUS_COLORS.PENDING },
  SOLVED: { label: "Solved", color: STATUS_COLORS.SOLVED },
  CLOSED: { label: "Closed", color: STATUS_COLORS.CLOSED },
} satisfies ChartConfig;

interface StatusChartProps {
  data: StatusBreakdownItem[] | undefined;
  loading: boolean;
}

export function StatusChart({ data, loading }: StatusChartProps) {
  const total = useMemo(
    () => data?.reduce((sum, d) => sum + d.count, 0) ?? 0,
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Breakdown</CardTitle>
        <CardDescription>Ticket distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Skeleton className="h-[250px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No tickets in this period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[250px] w-full max-w-[300px]"
          >
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "hsl(220, 9%, 46%)"}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        {/* Legend */}
        {data && data.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {data.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-1.5 text-xs"
              >
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <span className="text-muted-foreground">
                  {chartConfig[item.status as keyof typeof chartConfig]
                    ?.label ?? item.status}{" "}
                  ({item.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
