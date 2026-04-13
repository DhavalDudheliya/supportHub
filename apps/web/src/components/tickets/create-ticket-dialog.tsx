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
import { useCreateTicket } from "@/hooks/use-tickets";
import { useCustomersList } from "@/hooks/use-customers";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  customerId: z.string().min(1, "Customer is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

export function CreateTicketDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: customerData } = useCustomersList(1, 100, open);
  const customers = customerData?.customers || [];

  const createTicketMutation = useCreateTicket();

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

  async function onSubmit(values: CreateTicketForm) {
    createTicketMutation.mutate(
      {
        subject: values.subject,
        description: values.description,
        customerId: values.customerId,
        priority: values.priority,
      },
      {
        onSuccess: () => {
          toast.success("Ticket created successfully");
          reset();
          setOpen(false);
          onSuccess();
        },
      },
    );
  }

  const isPending = createTicketMutation.isPending;

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
                disabled={isPending}
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
                disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
