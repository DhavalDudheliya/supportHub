import { Metadata } from "next";

import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an Account | SupportHub",
  description: "Register for your SupportHub workspace",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
