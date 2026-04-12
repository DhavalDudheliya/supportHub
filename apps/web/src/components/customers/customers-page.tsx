"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  customerService,
  type Customer,
} from "@/lib/services/customer.service";
import { CustomersHeader } from "@/components/customers/customers-header";
import { CustomersStats } from "@/components/customers/customers-stats";
import { CustomersListCard } from "@/components/customers/customers-list-card";

const FETCH_LIMIT = 100;

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);

      const firstPage = await customerService.list(1, FETCH_LIMIT);
      const totalPages = Math.max(1, Math.ceil(firstPage.total / FETCH_LIMIT));

      if (totalPages === 1) {
        setCustomers(firstPage.customers);
        setTotal(firstPage.total);
        return;
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          customerService.list(index + 2, FETCH_LIMIT),
        ),
      );

      setCustomers([
        ...firstPage.customers,
        ...remainingPages.flatMap((response) => response.customers),
      ]);
      setTotal(firstPage.total);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
