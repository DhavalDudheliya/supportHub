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

      if (errorMessage.toLowerCase().includes("email")) {
        setStep(1);
        toast.error("Email already in use");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
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
