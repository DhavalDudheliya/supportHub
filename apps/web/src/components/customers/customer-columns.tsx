"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Mail, Phone } from "lucide-react";
import { Column, ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@supporthub/ui/components/avatar";
import { Badge } from "@supporthub/ui/components/badge";
import { Button } from "@supporthub/ui/components/button";
import { Checkbox } from "@supporthub/ui/components/checkbox";

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { type Customer } from "@/lib/services/customer.service";

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: Column<Customer>;
}) {
  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      className="h-8 -ml-3 px-3 font-semibold text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting()}
    >
      {label}
      <SortIcon className="ml-1.5 h-3.5 w-3.5" />
    </Button>
  );
}

export function getCustomerColumns(
  onSuccess: () => void,
): ColumnDef<Customer>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader label="Customer" column={column} />
      ),
      cell: ({ row }) => {
        const customer = row.original;
        const initials = customer.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <p className="truncate font-medium text-foreground">
              {customer.name}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader label="Email" column={column} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <SortableHeader label="Phone" column={column} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          {row.original.phone ? (
            <span>{row.original.phone}</span>
          ) : (
            <Badge variant="outline">No phone</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader label="Created" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <CustomerFormDialog customer={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
  ];
}
