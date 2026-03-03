"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { authService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations/auth.schema";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("Your Workspace");

  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const subdomain = searchParams.get("subdomain");
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Attempt to format the subdomain into a readable workspace name
    // e.g., "acmecorp" -> "Acmecorp", or if they are on a real domain, extract it
    if (subdomain) {
      const formatted = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
      setWorkspaceName(formatted);
    } else if (typeof window !== "undefined") {
      // Fallback if subdomain searchParam isn't working as expected
      const host = window.location.hostname;
      const parts = host.split(".");
      if (
        parts.length > 2 ||
        (parts.length === 2 && host.includes("localhost"))
      ) {
        const sub = parts[0];
        if (sub) {
          setWorkspaceName(sub.charAt(0).toUpperCase() + sub.slice(1));
        }
      }
    }
  }, [subdomain]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await authService.loginUser(data);
      // Wait for auth context to hydrate with the new user data
      await refreshUser();

      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Login error:", error);
      const err = error as any;
      setApiError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Invalid email or password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
          Sign in to {workspaceName}
        </h2>
        <p className="text-lg text-gray-600">
          Welcome back! Please enter your details.
        </p>
      </div>

      {isVerified && (
        <div className="animate-in fade-in mb-6 rounded-md border border-green-200 bg-green-50 p-4 duration-300">
          <div className="flex">
            <div className="shrink-0">
              <CheckCircle2
                className="h-5 w-5 text-green-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Email verified!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your email has been successfully verified. You can now sign
                  in.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                Sign in failed
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
            Email
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
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

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="text-sm">
              <a
                href="#"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </a>
            </div>
          </div>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={`block w-full rounded-md border ${
                errors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              } py-3 pr-3 pl-10 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
              placeholder="••••••••"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="text-md flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </button>
      </form>
    </div>
  );
}
