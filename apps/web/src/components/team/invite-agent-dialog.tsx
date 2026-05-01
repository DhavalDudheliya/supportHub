"use client";

import { useState } from "react";
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
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@supporthub/ui/components/field";
import { toast } from "sonner";
import { Loader2, MailPlus } from "lucide-react";
import { useInviteAgent } from "@/hooks/use-invitations";

const inviteSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteAgentDialog() {
  const [open, setOpen] = useState(false);
  const inviteMutation = useInviteAgent();
  const loading = inviteMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: InviteFormValues) {
    inviteMutation.mutate(values.email, {
      onSuccess: () => {
        toast.success("Invitation sent successfully");
        reset();
        setOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || "Failed to send invitation");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <MailPlus className="mr-2 h-4 w-4" />
            Invite Agent
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a new agent</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new agent to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                disabled={loading}
                {...register("email")}
              />
            </FieldContent>
            {errors.email && <FieldError errors={[errors.email]} />}
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
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
