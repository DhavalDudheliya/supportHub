import { Metadata } from "next";

import FindWorkspaceForm from "@/components/auth/find-workspace-form";

export const metadata: Metadata = {
  title: "Find Your Workspace | SupportHub",
  description: "Sign in to your SupportHub workspace",
};

export default function LoginPage() {
  return <FindWorkspaceForm />;
}
