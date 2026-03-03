"use client";

import React, { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";

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
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
          Find your workspace
        </h2>
        <p className="text-lg text-gray-600">
          Enter your email to sign in to your SupportHub workspace.
        </p>
      </div>

      {apiError && (
        <div className="animate-in fade-in mb-6 rounded-md border border-red-200 bg-red-50 p-4 duration-300">
          <div className="flex">
            <div className="shrink-0">
              <AlertCircle
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Workspace not found
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{apiError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Work email address
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={`block w-full rounded-md border ${
                errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              } py-3 pr-3 pl-10 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
              placeholder="you@company.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="text-md flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-center text-sm text-gray-600">
          <span>Don't have a workspace yet? </span>
          <Link
            href="/register"
            className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
