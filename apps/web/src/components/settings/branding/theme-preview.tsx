"use client";

import React from "react";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Search,
  Settings,
  TicketCheck,
  Users,
} from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";

interface ThemePreviewProps {
  logoUrl: string | null;
}

/**
 * ThemePreview — A miniature dashboard mockup that reflects the current
 * CSS variables in real time. Shows sidebar + header + cards so admins
 * can see the effect of their branding choices at a glance.
 */
export function ThemePreview({ logoUrl }: ThemePreviewProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-lg bg-background">
      <div className="flex h-[360px]">
        {/* Mini Sidebar */}
        <div className="flex w-12 flex-col items-center border-r border-border bg-background py-3 gap-2">
          {/* Logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-5 w-5 object-contain"
              />
            ) : (
              <TicketCheck className="h-4 w-4" />
            )}
          </div>

          {/* Nav icons */}
          {[LayoutDashboard, TicketCheck, Users, BarChart3].map((Icon, i) => (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                i === 0
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}

          <div className="flex-1" />

          {/* Bottom icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground">
            <Settings className="h-4 w-4" />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mini Header */}
          <div className="flex h-10 items-center gap-2 border-b border-border bg-background px-3">
            <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Search...
              </span>
            </div>
            <div className="relative">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </div>
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[8px] font-medium text-primary">AD</span>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 bg-muted/30 p-3 space-y-2 overflow-hidden">
            {/* Title */}
            <div className="h-4 w-24 rounded bg-foreground/15" />

            {/* Cards row */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-2 space-y-1.5"
                >
                  <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                  <div className="h-5 w-10 rounded bg-primary/15 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary">
                      {i * 12 + 3}
                    </span>
                  </div>
                  <div className="h-1.5 w-16 rounded bg-muted-foreground/10" />
                </div>
              ))}
            </div>

            {/* Table mockup */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex gap-2 px-2 py-1.5 border-b border-border bg-muted/40">
                {["Subject", "Status", "Priority"].map((col) => (
                  <span
                    key={col}
                    className="text-[8px] font-medium text-muted-foreground flex-1"
                  >
                    {col}
                  </span>
                ))}
              </div>
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex gap-2 px-2 py-1.5 border-b border-border last:border-b-0"
                >
                  <div className="flex-1 h-2 w-14 rounded bg-foreground/10" />
                  <div className="flex-1">
                    <span
                      className={cn(
                        "text-[7px] px-1.5 py-0.5 rounded-full font-medium",
                        row === 1
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : row === 2
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-primary/10 text-primary",
                      )}
                    >
                      {row === 1 ? "Open" : row === 2 ? "Pending" : "Solved"}
                    </span>
                  </div>
                  <div className="flex-1 h-2 w-8 rounded bg-foreground/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
