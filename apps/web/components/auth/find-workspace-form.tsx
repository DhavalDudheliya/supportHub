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
import { Input } from "@supporthub/ui/components/input";
import { Label } from "@supporthub/ui/components/label";

import { authService } from "@/lib/services/auth.service";
import { lookupDomainSchema } from "@/lib/validations/auth.schema";

type LookupValues = {
  email: string;
};

export default function FindWorkspaceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupValues>({
    resolver: zodResolver(lookupDomainSchema),
  });

  const onSubmit = async (data: LookupValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await authService.lookupDomain(data.email);

      const subdomain = response.subdomain;
      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

      // Redirect to the tenant-specific login page
      // We use window.location.href because we are changing the actual hostname
      // Next.js router.push() only works within the same origin
      window.location.href = `${protocol}://${subdomain}.${rootDomain}/login`;
    } catch (error: unknown) {
      console.error("Lookup error:", error);
      const err = error as any;
      setApiError(
        err.response?.data?.error ||
          "We couldn't find a workspace associated with that email address.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email address</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
              className="h-10 pl-9"
              placeholder="you@company.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full text-base"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Continue
        </Button>
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
