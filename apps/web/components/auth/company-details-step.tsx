"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@supporthub/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@supporthub/ui/components/input-group";
import { Label } from "@supporthub/ui/components/label";

import { companyDetailsSchema } from "@/lib/validations/auth.schema";

export type CompanyDetailsValues = {
  companyName: string;
  password: string;
};

interface CompanyDetailsStepProps {
  isLoading: boolean;
  onSubmit: (data: CompanyDetailsValues) => void;
  onBack: () => void;
}

export default function CompanyDetailsStep({
  isLoading,
  onSubmit,
  onBack,
}: CompanyDetailsStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyDetailsValues>({
    resolver: zodResolver(companyDetailsSchema),
  });

  const currentPassword = watch("password", "");

  const requirements = [
    { label: "At least 8 characters", met: currentPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(currentPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(currentPassword) },
    { label: "One number", met: /\d/.test(currentPassword) },
    {
      label: "One special character (@$!%*?&)",
      met: /[@$!%*?&]/.test(currentPassword),
    },
  ];

  const strength = requirements.filter((r) => r.met).length;
  const strengthPercentage = (strength / 5) * 100;

  const getStrengthColor = () => {
    if (strength === 0) return "bg-muted";
    if (strength <= 2) return "bg-destructive";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength === 0) return "";
    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500"
    >
      <div className="space-y-1.5">
        <Label htmlFor="companyName">
          Company name <span className="text-destructive">*</span>
        </Label>
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
        <p className="text-[0.8rem] text-muted-foreground">
          This will be used to create your workspace URL.
        </p>
        {errors.companyName && (
          <p className="text-xs text-destructive animate-in slide-in-from-top-1">
            {errors.companyName.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          Password <span className="text-destructive">*</span>
        </Label>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <InputGroupText>
              <Lock aria-hidden="true" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            placeholder="••••••••"
            {...register("password")}
          />
        </InputGroup>
        {errors.password && (
          <p className="text-xs text-destructive animate-in slide-in-from-top-1">
            {errors.password.message}
          </p>
        )}

        {/* Password Strength Meter */}
        <div className="mt-4 rounded-xl border border-border bg-card/50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Password strength
            </span>
            <span
              className={`text-xs font-semibold ${
                strength === 0
                  ? "text-muted-foreground"
                  : strength <= 2
                    ? "text-destructive"
                    : strength <= 4
                      ? "text-yellow-500"
                      : "text-green-500"
              }`}
            >
              {getStrengthText()}
            </span>
          </div>

          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}
              style={{ width: `${Math.max(strengthPercentage, 3)}%` }}
            />
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                {req.met ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 transition-all duration-300" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/50 transition-all duration-300" />
                )}
                <span
                  className={`text-xs transition-colors duration-300 ${req.met ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
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
      </div>
    </form>
  );
}
