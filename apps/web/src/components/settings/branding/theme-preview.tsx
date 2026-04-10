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
    <div className="rounded-xl border border-border overflow-hidden shadow-2xl bg-background">
      <div className="flex h-[360px]">
        {/* Mini Sidebar */}
        <div className="flex w-14 flex-col items-center border-r border-border bg-sidebar py-4 gap-3">
          {/* Logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4 shadow-sm">
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
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                i === 0
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
          ))}

          <div className="flex-1" />

          {/* Bottom icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer mb-2">
            <Settings className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 bg-background">
          {/* Mini Header */}
          <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-2 w-32 h-6 rounded-md bg-muted/50" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 w-32">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Search...
                </span>
              </div>
              <div className="relative cursor-pointer">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-destructive border-[1.5px] border-background" />
              </div>
              <div className="h-7 w-7 rounded-sm bg-primary/15 flex items-center justify-center border border-primary/20 text-primary ml-1 font-semibold text-[9px] cursor-pointer">
                AD
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 bg-muted/30 p-5 space-y-4 overflow-hidden">
            {/* Title */}
            <div className="flex justify-between items-end">
              <div>
                <div className="h-5 w-32 rounded-md bg-foreground/10 mb-1.5" />
                <div className="h-3 w-48 rounded-md bg-muted-foreground/20" />
              </div>
              <div className="h-7 w-20 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium shadow-sm">
                + New Ticket
              </div>
            </div>

            {/* Cards row */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-2.5 w-14 rounded-full bg-muted-foreground/30" />
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[7px] text-primary">↗</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {i * 123 + 45}
                  </div>
                  <div className="h-1.5 w-24 rounded-full bg-muted" />
                </div>
              ))}
            </div>

            {/* Table mockup */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex gap-2 px-3 py-2 border-b border-border bg-muted/50">
                {["Subject", "Status", "Priority"].map((col) => (
                  <span
                    key={col}
                    className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex-1"
                  >
                    {col}
                  </span>
                ))}
              </div>
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="h-2 w-20 rounded-full bg-foreground/20 mb-1" />
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex-1">
                    <span
                      className={cn(
                        "text-[8px] px-2 py-0.5 rounded-md font-medium border",
                        row === 1
                          ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                          : row === 2
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                            : "bg-primary/10 text-primary border-primary/20",
                      )}
                    >
                      {row === 1 ? "Open" : row === 2 ? "Pending" : "Solved"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-10 rounded-full bg-foreground/15" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
