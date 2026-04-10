"use client";

import React from "react";
import { cn } from "@supporthub/ui/lib/utils";

const PRESETS = [
  { label: "Sharp", value: 0 },
  { label: "Subtle", value: 0.25 },
  { label: "Rounded", value: 0.5 },
  { label: "More", value: 0.75 },
  { label: "Pill", value: 1.0 },
] as const;

interface RadiusSliderProps {
  value: number;
  onChange: (radius: number) => void;
}

/**
 * RadiusSlider — A slider with labeled presets for border-radius.
 * Shows a visual preview of the current radius on a small card.
 */
export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Corner Roundness
      </label>
      <p className="text-xs text-muted-foreground">
        Adjust the border radius of UI elements
      </p>

      <div className="flex items-center gap-4 max-w-xs">
        {/* Range slider */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-primary"
          aria-label="Border radius"
        />

        {/* Value label */}
        <span className="text-sm font-mono text-muted-foreground w-14 text-right">
          {value.toFixed(2)}rem
        </span>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md border transition-colors",
              Math.abs(value - preset.value) < 0.01
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Visual preview */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-12 w-20 border-2 border-primary bg-primary/10 transition-all duration-200"
          style={{ borderRadius: `${value}rem` }}
        />
        <span className="text-xs text-muted-foreground">Preview</span>
      </div>
    </div>
  );
}
