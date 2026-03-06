import React from "react";

import Image from "next/image";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branded Area (Placeholder, can be customized per tenant later) */}
      <div className="relative hidden flex-col items-center justify-center bg-zinc-950 p-12 text-zinc-50 lg:flex lg:w-1/2">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/30 via-zinc-950 to-zinc-950 blur-2xl"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <h2 className="mb-4 text-4xl font-bold">Welcome to your Workspace</h2>
          <p className="text-lg text-zinc-400">
            Sign in to access your dashboard, support tickets, and team
            collaboration tools.
          </p>
        </div>
      </div>

      {/* Right side - Form container */}
      <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
