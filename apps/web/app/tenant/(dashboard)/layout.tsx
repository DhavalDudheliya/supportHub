"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { AuthProvider, useAuth } from "@/lib/auth-context";

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

  React.useEffect(() => {
    // Middleware handles most redirects, but client-side guard is still needed
    // for immediate UI response after logout or token expiry during a session.
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * DashboardLayout — Authenticated app shell.
 *
 * Wraps all dashboard pages with:
 * - AuthProvider for user state
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
    </AuthProvider>
  );
}
