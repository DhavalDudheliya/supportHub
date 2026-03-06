"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@supporthub/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@supporthub/ui/components/input-group";
import { Label } from "@supporthub/ui/components/label";

import { personalInfoSchema } from "@/lib/validations/auth.schema";

export type PersonalInfoValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

interface PersonalInfoStepProps {
  defaultValues?: PersonalInfoValues | null;
  onSubmit: (data: PersonalInfoValues) => void;
}

export default function PersonalInfoStep({
  defaultValues,
  onSubmit,
}: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: defaultValues || {},
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">
            First name <span className="text-destructive">*</span>
          </Label>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <InputGroupText>
                <User aria-hidden="true" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="firstName"
              type="text"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
          </InputGroup>
          {errors.firstName && (
            <p className="text-xs text-destructive animate-in slide-in-from-top-1">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            Last name <span className="text-destructive">*</span>
          </Label>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <InputGroupText>
                <User aria-hidden="true" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="lastName"
              type="text"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
          </InputGroup>
          {errors.lastName && (
            <p className="text-xs text-destructive animate-in slide-in-from-top-1">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Work email address <span className="text-destructive">*</span>
        </Label>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <InputGroupText>
              <Mail aria-hidden="true" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            placeholder="you@company.com"
            {...register("email")}
          />
        </InputGroup>
        {errors.email && (
          <p className="text-xs text-destructive animate-in slide-in-from-top-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number (optional)</Label>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <InputGroupText>
              <Phone aria-hidden="true" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 000-0000"
            {...register("phone")}
          />
        </InputGroup>
      </div>

      <div>
        <Button
          type="submit"
          className="group h-10 w-full text-base transition-all"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <span>Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
