"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PencilLine, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@supporthub/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@supporthub/ui/components/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@supporthub/ui/components/field";
import { Input } from "@supporthub/ui/components/input";

import {
  customerService,
  type Customer,
} from "@/lib/services/customer.service";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter the customer's name"),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormDialogProps {
  customer?: Customer;
  onSuccess: () => void;
}

export function CustomerFormDialog({
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
      });
    }
  }, [customer, open, reset]);

  async function onSubmit(values: CustomerFormValues) {
    setLoading(true);

    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
      };

      if (customer) {
        await customerService.update(customer.id, payload);
        toast.success("Customer updated successfully");
      } else {
        await customerService.create(payload);
        toast.success("Customer created successfully");
      }

      setOpen(false);
      reset({
        name: "",
        email: "",
        phone: "",
      });
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          `Failed to ${customer ? "update" : "create"} customer`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEditMode ? (
            <Button variant="outline" size="sm">
              <PencilLine className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit customer" : "Create customer"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the customer's contact details."
              : "Add a customer so your team can track tickets and contact information in one place."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <FieldContent>
              <Input
                id="name"
                placeholder="Ava Thompson"
                disabled={loading}
                {...register("name")}
              />
            </FieldContent>
            {errors.name && <FieldError errors={[errors.name]} />}
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                placeholder="ava@example.com"
                disabled={loading}
                {...register("email")}
              />
            </FieldContent>
            {errors.email && <FieldError errors={[errors.email]} />}
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <FieldContent>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                disabled={loading}
                {...register("phone")}
              />
            </FieldContent>
            {errors.phone && <FieldError errors={[errors.phone]} />}
          </Field>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
