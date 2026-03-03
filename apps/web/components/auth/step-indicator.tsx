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
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Create your account
      </h2>

      <div className="relative flex justify-between">
        <div
          className="absolute top-1/2 left-0 -mt-px h-0.5 w-full bg-gray-200"
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
                  ? "bg-indigo-600 text-white"
                  : currentStep === step.id
                    ? "border-2 border-indigo-600 bg-white text-indigo-600"
                    : "border-2 border-gray-300 bg-white text-gray-500"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>
            <div className="absolute top-8 mt-2 text-xs font-medium whitespace-nowrap text-gray-500">
              {step.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
