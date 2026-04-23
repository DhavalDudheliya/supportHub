"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { Loading } from "@supporthub/ui/components/loading";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { useTicketRealtime } from "@/hooks/use-ticket-realtime";

import AppHeader from "@/components/core/app-header";
import AppSidebar from "@/components/core/app-sidebar";

/**
 * AuthGuard — Protects dashboard routes.
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner during auth state hydration.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Enable global real-time notifications and cache invalidations
  useTicketRealtime();

  React.useEffect(() => {
    // Middleware handles most redirects, but client-side guard is still needed
    // for immediate UI response after logout or token expiry during a session.
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen />;
  }

  return <>{children}</>;
}

/**
 * DashboardLayout — Authenticated app shell.
 *
 * Wraps all dashboard pages with:
 * - AuthProvider for user state
 * - ThemeProvider for workspace branding (CSS variable injection)
 * - AuthGuard for route protection
 * - Sidebar (left) + Header (top) + Content area
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthGuard>
          <div className="flex h-screen overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AppHeader />
              <main className="flex-1 overflow-y-auto bg-muted/30">
                {children}
              </main>
            </div>
          </div>
        </AuthGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
