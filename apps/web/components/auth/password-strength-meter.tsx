"use client";

import { useMemo } from "react";

import { CheckCircle2, Circle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

/**
 * PasswordStrengthMeter - Visual indicator for password complexity.
 *
 * Evaluates the password against 5 requirements and displays:
 * - A color-coded progress bar (red -> yellow -> green)
 * - A strength label (Weak / Good / Strong)
 * - A checklist of individual requirements with met/unmet states
 *
 * Requirements mirror the Zod password schema in auth.schema.ts.
 */
export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  // Each requirement maps to a visual checklist item
  const requirements: Requirement[] = useMemo(
    () => [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /\d/.test(password) },
      {
        label: "One special character (@$!%*?&)",
        met: /[@$!%*?&]/.test(password),
      },
    ],
    [password],
  );

  // Strength score: 0-5 based on how many requirements are met
  const strength = requirements.filter((r) => r.met).length;
  const strengthPercentage = (strength / 5) * 100;

  // Color tiers: muted (0) -> red (1-2) -> yellow (3-4) -> green (5)
  const strengthColor =
    strength === 0
      ? "bg-muted"
      : strength <= 2
        ? "bg-destructive"
        : strength <= 4
          ? "bg-yellow-500"
          : "bg-green-500";

  const strengthText =
    strength === 0
      ? ""
      : strength <= 2
        ? "Weak"
        : strength <= 4
          ? "Good"
          : "Strong";

  const strengthTextColor =
    strength === 0
      ? "text-muted-foreground"
      : strength <= 2
        ? "text-destructive"
        : strength <= 4
          ? "text-yellow-500"
          : "text-green-500";

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Password strength
        </span>
        <span className={`text-xs font-semibold ${strengthTextColor}`}>
          {strengthText}
        </span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-500 ease-out ${strengthColor}`}
          // Min 3% width so the bar is always slightly visible
          style={{ width: `${Math.max(strengthPercentage, 3)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2">
            {req.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 transition-all duration-300" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/50 transition-all duration-300" />
            )}
            <span
              className={`text-xs transition-colors duration-300 ${req.met ? "text-foreground" : "text-muted-foreground"}`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
