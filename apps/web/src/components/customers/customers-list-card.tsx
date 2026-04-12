import { Search, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@supporthub/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@supporthub/ui/components/empty";
import { Input } from "@supporthub/ui/components/input";

import type { Customer } from "@/lib/services/customer.service";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerListContent } from "@/components/customers/customer-list-content";

interface CustomersListCardProps {
  customers: Customer[];
  filteredCustomers: Customer[];
  loading: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
}

export function CustomersListCard({
  customers,
  filteredCustomers,
  loading,
  query,
  onQueryChange,
  onRefresh,
}: CustomersListCardProps) {
  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Showing the newest customer records first.
          </CardDescription>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Filter this page by name, email, or phone"
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12 text-sm text-muted-foreground">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Empty className="border border-dashed py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>
                {customers.length === 0
                  ? "No customers yet"
                  : "No matching customers"}
              </EmptyTitle>
              <EmptyDescription>
                {customers.length === 0
                  ? "Create your first customer record to start organizing support conversations."
                  : "Try a different filter or refresh the list to see the latest records."}
              </EmptyDescription>
            </EmptyHeader>
            {customers.length === 0 && (
              <EmptyContent>
                <CustomerFormDialog onSuccess={onRefresh} />
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <CustomerListContent
            customers={filteredCustomers}
            onSuccess={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
