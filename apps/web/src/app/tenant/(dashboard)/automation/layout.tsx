"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavTabs } from "@/components/core/nav-tabs";

const automationNav = [
  { label: "Assignment Rules", href: "/automation" },
  { label: "AI Decisions", href: "/automation/ai-logs" },
];

export default function AutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      <NavTabs
        items={automationNav}
        ariaLabel="Automation Navigation"
        baseHref="/automation"
      />

      {/* Page Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
