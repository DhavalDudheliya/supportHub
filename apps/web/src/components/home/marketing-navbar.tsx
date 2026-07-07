"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { cn } from "@supporthub/ui/lib/utils";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function MarketingNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[#0a0a12]/80 backdrop-blur-2xl border-b border-white/6 shadow-lg shadow-black/20"
          : "bg-transparent",
      )}
    >
      {/* Scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-primary"
        style={{ width: progressWidth }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logos/logo.png"
              alt="SupportHub Logo"
              className="h-8 w-auto object-contain transition-opacity hover:opacity-90"
            />
            <span className="text-lg font-semibold tracking-tight text-white">
              SupportHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isHashLink = link.href.startsWith("#");
              const resolvedHref = isHashLink
                ? isHome
                  ? link.href
                  : `/${link.href}`
                : link.href;

              return (
                <Link
                  key={link.href}
                  href={resolvedHref}
                  className="relative px-3.5 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 rounded-lg group"
                >
                  <span className="relative z-10">{link.label}</span>
                  <div className="absolute inset-0 rounded-lg bg-white/4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="relative group px-5 py-2 rounded-lg text-sm font-medium text-primary-foreground overflow-hidden border border-primary/20 shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-primary rounded-lg" />
              <div className="absolute inset-0 bg-primary/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Shimmer */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="relative z-10">Start Free Trial</span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a12]/95 backdrop-blur-2xl border-b border-white/6"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isHashLink = link.href.startsWith("#");
                const resolvedHref = isHashLink
                  ? isHome
                    ? link.href
                    : `/${link.href}`
                  : link.href;

                return (
                  <Link
                    key={link.href}
                    href={resolvedHref}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/4 transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/6">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full px-4 py-2.5 text-center text-sm font-medium text-white/60 hover:text-white rounded-lg border border-white/8 hover:border-white/15 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full px-4 py-2.5 text-center text-sm font-medium text-primary-foreground bg-primary border border-primary/20 rounded-lg hover:bg-primary/90 shadow-md shadow-primary/10 transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
