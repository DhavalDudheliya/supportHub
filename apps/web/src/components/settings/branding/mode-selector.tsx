"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
}

/**
 * ModeSelector — A toggle group for selecting the default color mode.
 */
export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Default Appearance
      </label>
      <p className="text-xs text-muted-foreground">
        Set the default color mode for your workspace
      </p>

      <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
              value === mode.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={value === mode.value}
          >
            <mode.icon className="h-4 w-4" />
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
