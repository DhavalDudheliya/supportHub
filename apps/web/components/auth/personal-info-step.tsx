"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@supporthub/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@supporthub/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@supporthub/ui/components/input-group";

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

/**
 * PersonalInfoStep - Step 1 of the registration flow.
 *
 * Collects the user's name, email, and optional phone number.
 * Data is validated client-side via Zod before advancing to Step 2.
 */
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
    // Pre-populate fields when navigating back from Step 2
    defaultValues: defaultValues || {},
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">
              First name <span className="text-destructive">*</span>
            </FieldLabel>
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
                placeholder="John"
                {...register("firstName")}
              />
            </InputGroup>
            <FieldError errors={[errors.firstName]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">
              Last name <span className="text-destructive">*</span>
            </FieldLabel>
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
                placeholder="Doe"
                {...register("lastName")}
              />
            </InputGroup>
            <FieldError errors={[errors.lastName]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">
            Work email address <span className="text-destructive">*</span>
          </FieldLabel>
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
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Phone number (optional)</FieldLabel>
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
        </Field>

        <Button
          type="submit"
          className="group h-10 w-full text-base transition-all"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
