"use client";

import React, { useState } from "react";

import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@supporthub/ui/components/alert";

import { authService } from "@/lib/services/auth.service";

import CompanyDetailsStep, {
  type CompanyDetailsValues,
} from "./company-details-step";
import type { PersonalInfoValues } from "./personal-info-step";
import PersonalInfoStep from "./personal-info-step";
import RegistrationSuccess from "./registration-success";
import StepIndicator from "./step-indicator";

/**
 * RegisterForm - Multi-step registration orchestrator.
 *
 * Manages step navigation and shared state between:
 * - Step 1: PersonalInfoStep (name, email, phone)
 * - Step 2: CompanyDetailsStep (company name, password)
 * - Step 3: RegistrationSuccess (verification prompt)
 *
 * Only Step 2 triggers the API call, combining data from both steps.
 */
export default function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Persisted across steps so users don't lose data when navigating back
  const [personalData, setPersonalData] = useState<PersonalInfoValues | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Populated after successful registration for the success screen
  const [registeredSubdomain, setRegisteredSubdomain] = useState<string | null>(
    null,
  );
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  /** Save Step 1 data locally and advance — no API call yet */
  const onPersonalInfoSubmit = (data: PersonalInfoValues) => {
    setPersonalData(data);
    setApiError(null);
    setStep(2);
  };

  /** Combine both steps' data and submit to the registration API */
  const onCompanyDetailsSubmit = async (data: CompanyDetailsValues) => {
    // Guard: if personal data is somehow missing, send user back to Step 1
    if (!personalData) {
      setStep(1);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
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
      setStep(3);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      const err = error as any;
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred during registration. Please try again.";

      setApiError(errorMessage);

      // If the error is email-related (e.g. duplicate), navigate back to Step 1
      // so the user can correct their email address
      if (errorMessage.toLowerCase().includes("email")) {
        setStep(1);
        toast.error("Email already in use");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hide the step indicator on the success screen */}
      {step !== 3 && <StepIndicator currentStep={step} />}

      {apiError && step !== 3 && (
        <Alert variant="destructive" className="animate-in fade-in zoom-in-95">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <PersonalInfoStep
          defaultValues={personalData}
          onSubmit={onPersonalInfoSubmit}
        />
      )}

      {step === 2 && (
        <CompanyDetailsStep
          isLoading={isLoading}
          onSubmit={onCompanyDetailsSubmit}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <RegistrationSuccess
          email={registeredEmail}
          subdomain={registeredSubdomain}
        />
      )}
    </div>
  );
}
