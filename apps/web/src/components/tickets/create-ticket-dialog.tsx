"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@supporthub/ui/components/dialog";
import { Button } from "@supporthub/ui/components/button";
import { Input } from "@supporthub/ui/components/input";
import { Textarea } from "@supporthub/ui/components/textarea";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@supporthub/ui/components/field";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { ticketService } from "@/lib/services/ticket.service";
import {
  customerService,
  type Customer,
} from "@/lib/services/customer.service";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  customerId: z.string().min(1, "Customer is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

export function CreateTicketDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      description: "",
      customerId: "",
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    let cancelled = false;
    if (open) {
      customerService
        .list(1, 100)
        .then((res) => {
          if (!cancelled) setCustomers(res.customers);
        })
        .catch(() => {
          if (!cancelled) toast.error("Failed to load customers");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onSubmit(values: CreateTicketForm) {
    setLoading(true);
    try {
      await ticketService.create({
        subject: values.subject,
        description: values.description,
        customerId: values.customerId,
        priority: values.priority,
      });
      toast.success("Ticket created successfully");
      reset();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new ticket</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a support ticket.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.subject}>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <FieldContent>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                disabled={loading}
                {...register("subject")}
              />
            </FieldContent>
            {errors.subject && <FieldError errors={[errors.subject]} />}
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <FieldContent>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                rows={4}
                disabled={loading}
                {...register("description")}
              />
            </FieldContent>
            {errors.description && <FieldError errors={[errors.description]} />}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.customerId}>
              <FieldLabel htmlFor="customerId">Customer</FieldLabel>
              <FieldContent>
                <select
                  id="customerId"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                  {...register("customerId")}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </FieldContent>
              {errors.customerId && <FieldError errors={[errors.customerId]} />}
            </Field>

            <Field data-invalid={!!errors.priority}>
              <FieldLabel htmlFor="priority">Priority</FieldLabel>
              <FieldContent>
                <select
                  id="priority"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={loading}
                  {...register("priority")}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </FieldContent>
              {errors.priority && <FieldError errors={[errors.priority]} />}
            </Field>
          </div>

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
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
