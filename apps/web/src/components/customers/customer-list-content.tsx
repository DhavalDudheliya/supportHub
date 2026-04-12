"use client";

import { useMemo } from "react";
import { ListChecks } from "lucide-react";

import { DataTable } from "@supporthub/ui/components/data-table";

import { getCustomerColumns } from "@/components/customers/customer-columns";
import { type Customer } from "@/lib/services/customer.service";

interface CustomerListContentProps {
  customers: Customer[];
  onSuccess: () => void;
}

export function CustomerListContent({
  customers,
  onSuccess,
}: CustomerListContentProps) {
  const columns = useMemo(() => getCustomerColumns(onSuccess), [onSuccess]);

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <ListChecks className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-medium">No customers found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different search or refresh the list to load the latest records.
        </p>
      </div>
    );
  }

  return <DataTable columns={columns} data={customers} />;
}
