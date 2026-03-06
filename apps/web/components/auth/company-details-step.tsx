"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@supporthub/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@supporthub/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@supporthub/ui/components/input-group";

import { companyDetailsSchema } from "@/lib/validations/auth.schema";

import PasswordStrengthMeter from "./password-strength-meter";

export type CompanyDetailsValues = {
  companyName: string;
  password: string;
};

interface CompanyDetailsStepProps {
  isLoading: boolean;
  onSubmit: (data: CompanyDetailsValues) => void;
  onBack: () => void;
}

/**
 * CompanyDetailsStep - Step 2 of the registration flow.
 *
 * Collects the company name (used to generate the workspace subdomain)
 * and a password. Includes a real-time password strength meter.
 */
export default function CompanyDetailsStep({
  isLoading,
  onSubmit,
  onBack,
}: CompanyDetailsStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyDetailsValues>({
    resolver: zodResolver(companyDetailsSchema),
  });

  // Watch the password field to feed real-time updates to the strength meter
  const currentPassword = watch("password", "");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="animate-in fade-in slide-in-from-right-8 duration-500"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="companyName">
            Company name <span className="text-destructive">*</span>
          </FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <InputGroupText>
                <Building2 aria-hidden="true" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="companyName"
              type="text"
              aria-invalid={!!errors.companyName}
              placeholder="Acme Inc."
              {...register("companyName")}
            />
          </InputGroup>
          <FieldDescription>
            This will be used to create your workspace URL.
          </FieldDescription>
          <FieldError errors={[errors.companyName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            Password <span className="text-destructive">*</span>
          </FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <InputGroupText>
                <Lock aria-hidden="true" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              placeholder="••••••••"
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.password]} />
          <PasswordStrengthMeter password={currentPassword} />
        </Field>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="h-10 px-6 text-base transition-colors hover:bg-muted"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 flex-1 text-base transition-all"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating workspace..." : "Create Account"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
