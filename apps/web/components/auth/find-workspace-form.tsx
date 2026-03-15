"use client";

import React, { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@supporthub/ui/components/alert";
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

import { authService } from "@/lib/services/auth.service";
import { lookupWorkspaceSchema } from "@/lib/validations/auth.schema";

type LookupValues = {
  email: string;
};

/**
 * FindWorkspaceForm - Entry point for existing users.
 *
 * Looks up the user's email to find their tenant subdomain,
 * then redirects to the tenant-specific login page.
 * Uses window.location.href (not Next.js router) because the
 * redirect changes the hostname (e.g. app.com -> acme.app.com).
 */
export default function FindWorkspaceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupValues>({
    resolver: zodResolver(lookupWorkspaceSchema),
  });

  const onSubmit = async (data: LookupValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await authService.lookupWorkspace(data.email);

      if ("subdomain" in response) {
        const subdomain = response.subdomain;
        const rootDomain =
          process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
        const protocol =
          process.env.NODE_ENV === "production" ? "https" : "http";

        // Full page redirect — crosses subdomain boundary, can't use Next.js router
        window.location.href = `${protocol}://${subdomain}.${rootDomain}/login`;
      } else {
        setApiError(response.message);
      }
    } catch (error: unknown) {
      console.error("Lookup error:", error);
      const err = error as any;
      setApiError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "We couldn't find a workspace associated with that email address.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
          Find your workspace
        </h2>
        <p className="text-lg text-muted-foreground">
          Enter your email to sign in to your SupportHub workspace.
        </p>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workspace not found</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Work email address</FieldLabel>
            <InputGroup className="h-10">
              <InputGroupAddon>
                <InputGroupText>
                  <Search aria-hidden="true" />
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

          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 w-full text-base"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Continue
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-center text-sm text-muted-foreground">
          <span>Don't have a workspace yet? </span>
          <Link
            href="/register"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
