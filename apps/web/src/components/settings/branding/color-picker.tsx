"use client";

import React from "react";
import { cn } from "@supporthub/ui/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  description?: string;
}

/**
 * ColorPicker — A styled hex color picker with swatch preview and text input.
 * Uses the native <input type="color"> for the actual picker UI, wrapped
 * in a styled container for visual consistency.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  description,
}: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-3">
        {/* Color swatch with native picker */}
        <div className="relative">
          <div
            className="h-10 w-10 rounded-lg border border-border shadow-sm cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            aria-label={`Pick ${label}`}
          />
        </div>

        {/* Hex text input */}
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              if (val.length === 7) {
                onChange(val);
              }
            }
          }}
          placeholder="#000000"
          className={cn(
            "h-10 w-28 rounded-lg border border-border bg-background px-3 text-sm font-mono",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          )}
          maxLength={7}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
