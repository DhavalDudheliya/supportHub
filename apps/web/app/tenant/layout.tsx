"use client";

import React from "react";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <style jsx>{`
        @keyframes float-1 {
          0%,
          100% {
            transform: translate(-50%, 0%) scale(1);
          }
          50% {
            transform: translate(-50%, 8%) scale(1.05);
          }
        }
        @keyframes float-2 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1);
          }
          50% {
            transform: translate(5%, -8%) scale(1.08);
          }
        }
        @keyframes float-3 {
          0%,
          100% {
            transform: translate(0%, 0%) scale(1.05);
          }
          50% {
            transform: translate(-5%, -6%) scale(1);
          }
        }
      `}</style>

      {/* Animated ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[30%] left-1/2 h-[600px] w-[900px] rounded-full bg-primary/20 blur-[140px]"
          style={{ animation: "float-1 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-[10%] -left-[5%] h-[400px] w-[500px] rounded-full bg-indigo-400/15 blur-[120px]"
          style={{ animation: "float-2 10s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-[10%] -right-[5%] h-[400px] w-[500px] rounded-full bg-violet-400/15 blur-[120px]"
          style={{ animation: "float-3 12s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
