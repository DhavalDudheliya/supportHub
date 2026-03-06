"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@supporthub/ui/components/input-group";

import { useAuth } from "@/lib/auth-context";
import { authService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations/auth.schema";

type LoginValues = {
  email: string;
  password: string;
};

/**
 * LoginForm - Tenant-scoped login form.
 *
 * Displayed on tenant subdomains (e.g. acme.supporthub.com/login).
 * Derives the workspace name from the subdomain for display.
 * Shows a verification success banner when redirected from email verification.
 */
export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>("Your Workspace");

  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const subdomain = searchParams.get("subdomain");
  const { refreshUser } = useAuth();

  // Derive a human-readable workspace name from the subdomain.
  // Priority: searchParam > hostname extraction > fallback ("Your Workspace")
  useEffect(() => {
    if (subdomain) {
      const formatted = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
      setWorkspaceName(formatted);
    } else if (typeof window !== "undefined") {
      // Fallback: extract subdomain from the current hostname
      // e.g. "acme.localhost:3000" -> "Acme"
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
      // Refresh auth context so protected routes recognize the new session
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
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
                required
                aria-invalid={!!errors.email}
                placeholder="you@company.com"
                {...register("email")}
              />
            </InputGroup>
            <FieldError errors={[errors.email]} />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                className="text-sm font-semibold text-primary hover:text-primary/80"
              >
                Forgot password?
              </a>
            </div>
            <InputGroup className="h-10">
              <InputGroupAddon>
                <InputGroupText>
                  <Lock aria-hidden="true" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
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
          </Field>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 w-full text-base"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Sign In
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
