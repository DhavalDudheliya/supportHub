"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@supporthub/ui/components/alert";
import { Button } from "@supporthub/ui/components/button";
import { Input } from "@supporthub/ui/components/input";
import { Label } from "@supporthub/ui/components/label";

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
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
          Sign in to {workspaceName}
        </h2>
        <p className="text-lg text-muted-foreground">
          Welcome back! Please enter your details.
        </p>
      </div>

      {isVerified && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Email verified!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400/80">
            Your email has been successfully verified. You can now sign in.
          </AlertDescription>
        </Alert>
      )}

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!errors.password}
              className="h-10 pl-9"
              placeholder="••••••••"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full text-base"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Sign In
        </Button>
      </form>
    </div>
  );
}
