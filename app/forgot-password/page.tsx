import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth/server";

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect(routes.authenticatedHome);
  return <AuthShell description="Enter your email address and we will prepare a password reset code if an account is available." statement={["A quick reset.", "Then you are back on track."]} supportingText="Enter your email and we will help you securely regain access to your account." title="Reset your password"><ForgotPasswordForm /></AuthShell>;
}
