import { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard | SupportHub",
  description: "Overview of your SupportHub workspace",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
