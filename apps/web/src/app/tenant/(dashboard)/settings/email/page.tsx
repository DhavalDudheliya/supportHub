import { Suspense } from "react";
import { EmailSettingsPage } from "@/components/settings/email/email-settings-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Settings | SupportHub",
  description: "Connect your email accounts to SupportHub.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <EmailSettingsPage />
    </Suspense>
  );
}
