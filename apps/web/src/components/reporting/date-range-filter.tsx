"use client";

import { cn } from "@supporthub/ui/lib/utils";
import { Button } from "@supporthub/ui/components/button";

export type DatePreset = "7d" | "30d" | "90d";

interface DateRangeFilterProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
}

const presets: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/** Convert a preset to { from, to } ISO strings. */
export function presetToRange(preset: DatePreset): {
  from: string;
  to: string;
} {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "90d":
      from.setDate(from.getDate() - 90);
      break;
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

export function DateRangeFilter({
  activePreset,
  onPresetChange,
}: DateRangeFilterProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {presets.map((p) => (
        <Button
          key={p.value}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-3 text-xs font-medium",
            activePreset === p.value &&
              "bg-background shadow-sm text-foreground hover:bg-background",
          )}
          onClick={() => onPresetChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
