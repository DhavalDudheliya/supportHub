import { Metadata } from "next";

import { CustomersPage } from "@/components/customers/customers-page";

export const metadata: Metadata = {
  title: "Customers | SupportHub",
  description: "Manage customer records in your SupportHub workspace",
};

export default function CustomersDashboardPage() {
  return <CustomersPage />;
}
