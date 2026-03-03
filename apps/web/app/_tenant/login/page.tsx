import { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | SupportHub",
  description: "Sign in to your SupportHub workspace",
};

export default function TenantLoginPage() {
  return <LoginForm />;
}
