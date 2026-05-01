"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  Settings,
  TicketCheck,
  Users,
  Zap,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@supporthub/ui/components/tooltip";

import { cn } from "@supporthub/ui/lib/utils";
import { useWorkspaceTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: TicketCheck, label: "Tickets", href: "/tickets" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: BarChart3, label: "Reporting", href: "/reporting", adminOnly: true },
  { icon: Zap, label: "Automation", href: "/automation", adminOnly: true },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/settings", adminOnly: true },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

/**
 * AppSidebar — Narrow icon-only sidebar for the authenticated app shell.
 *
 * Matches the design: workspace logo at top (custom or default), main nav icons,
 * settings + help at bottom. Active route is highlighted with
 * a filled background.
 */
export default function AppSidebar() {
  const pathname = usePathname();
  const { theme } = useWorkspaceTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-border bg-background py-4">
      {/* Logo — custom workspace logo or default icon */}
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105 overflow-hidden"
      >
        {theme?.logoUrl ? (
          <img
            src={theme.logoUrl}
            alt="Workspace logo"
            className="h-6 w-6 object-contain"
          />
        ) : (
          <TicketCheck className="h-5 w-5" />
        )}
      </Link>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {mainNavItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    />
                  }
                >
                  <item.icon className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-1">
        {bottomNavItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    />
                  }
                >
                  <item.icon className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
      </div>
    </aside>
  );
}
