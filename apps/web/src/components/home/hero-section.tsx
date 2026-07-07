"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

// Lazy-load the heavy Three.js particle field
const HeroParticles = dynamic(
  () => import("./hero-particles").then((m) => ({ default: m.HeroParticles })),
  { ssr: false },
);

export function HeroSection() {
  return (
    <section className="relative isolate min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Three.js Particle Background */}
      <Suspense fallback={null}>
        <HeroParticles />
      </Suspense>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0a12] via-transparent to-[#0a0a12]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 48% 36% at 50% 51%, rgba(10, 10, 18, 0.82) 0%, rgba(10, 10, 18, 0.66) 42%, rgba(10, 10, 18, 0.18) 72%, transparent 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/8 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
            14 days free · No credit card required
          </div>
        </motion.div>

        {/* Main Headline — visible by default so crawlers/OAuth reviewers
            see the app name and purpose without executing animation JS */}
        <motion.h1
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6 text-white"
        >
          <span className="block text-2xl sm:text-3xl font-semibold text-white/60 mb-3 tracking-widest uppercase">
            SupportHub
          </span>
          AI-powered support.
          <br />
          <span className="bg-linear-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x bg-size-[200%_auto]">
            Zero friction.
          </span>
        </motion.h1>

        {/* Subheadline — static for crawlers, animated for users */}
        <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed">
          <motion.span
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="block"
          >
            SupportHub is an AI-powered customer support ticketing system that
            connects with Gmail and Outlook — automatically converting inbound
            emails into structured tickets, routing them to the right agents,
            and enabling real-time team collaboration.
          </motion.span>
        </p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/register"
            id="cta-start-trial"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-primary-foreground overflow-hidden shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-shadow border border-primary/20"
          >
            <div className="absolute inset-0 bg-primary" />
            <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative z-10">Start Free Trial</span>
            <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            id="cta-see-how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/3 transition-all duration-300"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xs text-white/25 mt-8"
        >
          Connects with Gmail & Outlook · Setup in under 5 minutes
        </motion.p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#0a0a12] to-transparent z-20" />
    </section>
  );
}
