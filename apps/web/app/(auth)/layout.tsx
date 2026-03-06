import React from "react";

import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:w-1/2">
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
          <Link
            href="/"
            className="mb-16 flex items-center gap-2 hover:opacity-90 transition-opacity w-fit"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground">
              <span className="text-xl font-bold text-primary">S</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-primary-foreground">
              SupportHub
            </span>
          </Link>

          <h1 className="mb-6 text-5xl leading-tight font-bold">
            Customer support
            <br />
            made simple.
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
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
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary bg-primary/20"
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
              <p className="font-semibold text-primary-foreground">
                Trusted by 10,000+ teams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form container */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
