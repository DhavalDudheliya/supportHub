"use client";

import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { authService } from "@/lib/services/auth.service";
import {
  companyDetailsSchema,
  personalInfoSchema,
} from "@/lib/validations/auth.schema";

import StepIndicator from "./step-indicator";

type PersonalInfoValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type CompanyDetailsValues = {
  companyName: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [personalData, setPersonalData] = useState<PersonalInfoValues | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [registeredSubdomain, setRegisteredSubdomain] = useState<string | null>(
    null,
  );
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const router = useRouter();

  // Step 1 Form
  const {
    register: registerPersonalInfo,
    handleSubmit: handlePersonalInfoSubmit,
    formState: { errors: personalErrors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalData || {},
  });

  // Step 2 Form
  const {
    register: registerCompanyDetails,
    handleSubmit: handleCompanyDetailsSubmit,
    formState: { errors: companyErrors },
  } = useForm<CompanyDetailsValues>({
    resolver: zodResolver(companyDetailsSchema),
  });

  const onPersonalInfoSubmit = (data: PersonalInfoValues) => {
    setPersonalData(data);
    setApiError(null);
    setStep(2);
  };

  const onCompanyDetailsSubmit = async (data: CompanyDetailsValues) => {
    if (!personalData) {
      setStep(1);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Combine data from both steps (excluding confirmPassword which is frontend-only)
      const payload = {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        email: personalData.email,
        phone: personalData.phone,
        companyName: data.companyName,
        password: data.password,
      };

      const response = await authService.registerUser(payload);

      toast.success("Account created successfully!");
      setRegisteredSubdomain(response.subdomain || null);
      setRegisteredEmail(personalData.email);
      setStep(3); // Move to success/verification step
    } catch (error: unknown) {
      console.error("Registration error:", error);

      const err = error as any;
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred during registration. Please try again.";

      setApiError(errorMessage);

      // If error mentions email, go back to step 1
      if (errorMessage.toLowerCase().includes("email")) {
        setStep(1);
        toast.error("Email already in use");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    if (registeredSubdomain) {
      // Redirect to their specific tenant login
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
      window.location.href = `${protocol}://${registeredSubdomain}.${rootDomain}/login`;
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="w-full">
      <StepIndicator currentStep={step} />

      {apiError && step !== 3 && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <AlertCircle
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Registration failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{apiError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Personal Info */}
      {step === 1 && (
        <form
          onSubmit={handlePersonalInfoSubmit(onPersonalInfoSubmit)}
          className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                className={`block w-full rounded-md border ${
                  personalErrors.firstName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                } px-3 py-2 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
                {...registerPersonalInfo("firstName")}
              />
              {personalErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {personalErrors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                className={`block w-full rounded-md border ${
                  personalErrors.lastName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                } px-3 py-2 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
                {...registerPersonalInfo("lastName")}
              />
              {personalErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {personalErrors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Work email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`block w-full rounded-md border ${
                personalErrors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              } px-3 py-2 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
              {...registerPersonalInfo("email")}
            />
            {personalErrors.email && (
              <p className="mt-1 text-sm text-red-600">
                {personalErrors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Phone number (optional)
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              {...registerPersonalInfo("phone")}
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-center text-sm text-gray-600">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}

      {/* STEP 2: Company Details */}
      {step === 2 && (
        <form
          onSubmit={handleCompanyDetailsSubmit(onCompanyDetailsSubmit)}
          className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500"
        >
          <div>
            <label
              htmlFor="companyName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Company name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="companyName"
                type="text"
                className={`block w-full rounded-md border ${
                  companyErrors.companyName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                } px-3 py-2 focus:ring-1 focus:outline-none sm:text-sm`}
                {...registerCompanyDetails("companyName")}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be used to create your workspace URL (e.g.,
              yourcompany.supporthub.com)
            </p>
            {companyErrors.companyName && (
              <p className="mt-1 text-sm text-red-600">
                {companyErrors.companyName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={`block w-full rounded-md border ${
                companyErrors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              } px-3 py-2 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
              {...registerCompanyDetails("password")}
            />
            {companyErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {companyErrors.password.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with upper/lowercase, numbers, and
              symbols.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`block w-full rounded-md border ${
                companyErrors.confirmPassword
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              } px-3 py-2 shadow-sm focus:ring-1 focus:outline-none sm:text-sm`}
              {...registerCompanyDetails("confirmPassword")}
            />
            {companyErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {companyErrors.confirmPassword.message}
              </p>
            )}

            <div className="mt-6 flex gap-4">
              {" "}
              {/* Added mt-6 for spacing */}
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="w-1/3 justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-2/3 items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: Verification Success */}
      {step === 3 && (
        <div className="animate-in zoom-in-95 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm duration-500">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-900">
            Check your email
          </h3>
          <p className="mb-6 text-gray-600">
            We've sent a verification link to{" "}
            <span className="font-semibold text-gray-900">
              {registeredEmail}
            </span>
            . Please verify your email address to access your workspace.
          </p>

          <div className="mb-8 inline-block rounded-lg bg-gray-50 p-4 text-left">
            <p className="mb-1 text-sm font-medium text-gray-500">
              Your workspace URL will be:
            </p>
            <p className="text-md rounded border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-mono text-indigo-700">
              {registeredSubdomain}.supporthub.com
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={goBackToLogin}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Login
            </button>
            <button
              onClick={() => {
                // In a real app, you might trigger a resend-verification API call here
                toast.success("A new verification link has been requested.");
              }}
              className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Resend verification email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
