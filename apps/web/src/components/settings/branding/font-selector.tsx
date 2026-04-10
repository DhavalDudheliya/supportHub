"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";

const FONTS = [
  "Inter",
  "Roboto",
  "DM Sans",
  "Poppins",
  "Plus Jakarta Sans",
  "Outfit",
  "Nunito",
  "Lato",
  "Source Sans 3",
  "Open Sans",
] as const;

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

/**
 * FontSelector — A dropdown that lets admins pick from curated Google Fonts.
 * Each option is rendered in its own typeface for instant visual comparison.
 */
export function FontSelector({ value, onChange }: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload all font previews
  useEffect(() => {
    const families = FONTS.filter((f) => f !== "Inter")
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500`)
      .join("&");

    const linkId = "font-selector-preview-fonts";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Font Family</label>
      <p className="text-xs text-muted-foreground">
        Choose a typeface for your workspace
      </p>
      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex h-10 w-full max-w-xs items-center justify-between rounded-lg border border-border bg-background px-3 text-sm",
            "hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          )}
          style={{ fontFamily: `${value}, sans-serif` }}
        >
          <span>{value}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full max-w-xs overflow-hidden rounded-lg border border-border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="max-h-60 overflow-y-auto py-1">
              {FONTS.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => {
                    onChange(font);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                    font === value
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                  style={{ fontFamily: `${font}, sans-serif` }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      font === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{font}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
