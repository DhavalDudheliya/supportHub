"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@supporthub/ui/components/button";
import { Check } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started with support.",
    cta: "Start Free Trial",
    ctaHref: "/register",
    highlighted: false,
    features: [
      "Up to 3 agents",
      "100 tickets / month",
      "Email-to-ticket (1 inbox)",
      "Basic dashboard",
      "14-day Pro trial included",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "per agent / month",
    description: "For growing teams that need AI and automation.",
    cta: "Start Free Trial",
    ctaHref: "/register",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Unlimited agents",
      "Unlimited tickets",
      "Gmail & Outlook integration",
      "AI auto-tagging",
      "Assignment rules & routing",
      "Real-time WebSocket updates",
      "Internal notes & collaboration",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description:
      "For organizations with advanced security and compliance needs.",
    cta: "Contact Us",
    ctaHref: "mailto:sales@supporthub.io",
    highlighted: false,
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Dedicated account manager",
      "Custom SLA",
      "Advanced audit logs",
      "On-premise deployment option",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with a 14-day Pro trial. No credit card required. Upgrade
            when you&#39;re ready.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-xl border p-6 lg:p-8",
                tier.highlighted
                  ? "border-primary/50 bg-background shadow-xl shadow-primary/5 scale-[1.02]"
                  : "border-border/60 bg-background",
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-muted-foreground">
                      /{tier.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                render={<Link href={tier.ctaHref} />}
                variant={tier.highlighted ? "default" : "outline"}
                className={cn(
                  "w-full",
                  tier.highlighted && "shadow-md shadow-primary/20",
                )}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
