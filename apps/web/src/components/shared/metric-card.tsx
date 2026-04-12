import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@supporthub/ui/components/card";
import { Skeleton } from "@supporthub/ui/components/skeleton";

interface MetricCardProps {
  loading?: boolean;
  title: string;
  value: React.ReactNode;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  headerClassName?: string;
}

export function MetricCard({
  loading,
  title,
  value,
  description,
  icon: Icon,
  className,
  headerClassName,
}: MetricCardProps) {
  return (
    <Card className={className || "h-full"}>
      <CardHeader className={headerClassName}>
        <CardDescription>{title}</CardDescription>
        {Icon && (
          <CardAction>
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </CardAction>
        )}
        <CardTitle className="text-3xl">
          {loading ? <Skeleton className="h-9 w-20" /> : value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}
