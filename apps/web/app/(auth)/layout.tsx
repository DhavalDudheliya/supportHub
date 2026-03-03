import React from "react";

import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-indigo-600 p-12 text-white lg:flex lg:w-1/2">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <polygon points="0,100 100,0 100,100" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <span className="text-xl font-bold text-indigo-600">S</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              SupportHub
            </span>
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold">
            Customer support
            <br />
            made simple.
          </h1>
          <p className="max-w-md text-lg text-indigo-100">
            Join thousands of companies using SupportHub to deliver exceptional
            customer experiences.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-indigo-600 bg-indigo-300"
                >
                  <Image
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt={`User ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-white">
                Trusted by 10,000+ teams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form container */}
      <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
