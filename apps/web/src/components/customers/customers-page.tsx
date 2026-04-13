"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCustomers } from "@/hooks/use-customers";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { CustomersHeader } from "@/components/customers/customers-header";
import { CustomersStats } from "@/components/customers/customers-stats";
import { CustomersListCard } from "@/components/customers/customers-list-card";

const FETCH_LIMIT = 100;

export function CustomersPage() {
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useCustomers();
  const customers = data?.customers || [];
  const total = data?.total || 0;

  const fetchCustomers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
  }, [queryClient]);

  const filteredCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [customers, query]);

  const customersWithPhone = useMemo(
    () => customers.filter((customer) => customer.phone).length,
    [customers],
  );

  const recentCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const ageInDays =
          (Date.now() - new Date(customer.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return ageInDays <= 7;
      }).length,
    [customers],
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      <CustomersHeader loading={loading} onRefresh={fetchCustomers} />

      <CustomersStats
        stats={{
          total,
          withPhone: customersWithPhone,
          addedThisWeek: recentCustomers,
        }}
      />

      <CustomersListCard
        customers={customers}
        filteredCustomers={filteredCustomers}
        loading={loading}
        query={query}
        onQueryChange={setQuery}
        onRefresh={fetchCustomers}
      />
    </div>
  );
}
