import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { RefreshButton } from "@/components/shared/refresh-button";

interface CustomersHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export function CustomersHeader({ loading, onRefresh }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep your customer records organized so agents can respond faster
            and keep conversations anchored to the right people.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <RefreshButton onClick={onRefresh} disabled={loading} />
        <CustomerFormDialog onSuccess={onRefresh} />
      </div>
    </div>
  );
}
