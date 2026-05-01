"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ReportingPage } from "@/components/reporting/reporting-page";
import { useAuth } from "@/lib/auth-context";

export default function ReportingRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  return <ReportingPage />;
}
