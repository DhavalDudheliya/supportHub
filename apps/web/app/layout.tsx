import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/auth-context";
import "@supporthub/ui/globals.css";
import { Providers } from "@/components/providers";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SupportHub | Customer Support Platform",
  description: "Customer support made simple with multi-tenant workspaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
