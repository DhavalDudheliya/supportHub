import { Metadata } from "next";
import { AcceptInvitePage } from "@/components/auth/accept-invite-page";

export const metadata: Metadata = {
  title: "Accept Invitation | SupportHub",
  description: "Join your team's SupportHub workspace",
};

import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AcceptInvitePage />
    </Suspense>
  );
}
