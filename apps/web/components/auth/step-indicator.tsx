"use client";

import React from "react";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: "Personal Info" },
  { id: 2, name: "Company Details" },
  { id: 3, name: "Verification" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-foreground">
        Create your account
      </h2>

      <div className="relative flex justify-between px-2">
        <div
          className="absolute top-1/2 left-2 right-2 -mt-px h-0.5 bg-border"
          aria-hidden="true"
        />

        {steps.map((step, stepIdx) => (
          <div
            key={step.name}
            className="relative z-10 flex flex-col items-center"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
                currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                    ? "border-2 border-primary bg-background text-primary"
                    : "border-2 border-muted-foreground/30 bg-background text-muted-foreground"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>
            <div className="absolute top-8 mt-2 text-xs font-medium whitespace-nowrap text-muted-foreground">
              {step.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
