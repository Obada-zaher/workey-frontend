import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { routes } from "@/config/routes";
import { getCurrentUser, getPendingPasswordResetView } from "@/lib/auth/server";
import { maskEmail } from "@/lib/auth/verification";

export default async function ResetPasswordPage() {
  const pending = await getPendingPasswordResetView();
  if (!pending && await getCurrentUser()) redirect(routes.authenticatedHome);
  if (!pending) return <AuthShell description="Start a password reset request first so we can securely prepare your reset code." statement={["Create a new password.", "Continue your journey with confidence."]} supportingText="Choose a secure new password to protect your account and continue using Workey." title="Reset your password"><div className="mt-5 grid gap-4"><Link className="ui-button ui-button--primary" href="/forgot-password">Request a reset code</Link><p className="type-body-small text-text-secondary"><Link className="font-semibold" href="/login">Return to log in</Link></p></div></AuthShell>;
  return <AuthShell description={<>Enter the code sent for <span className="font-semibold text-text-primary">{maskEmail(pending.email)}</span> and choose a new password.</>} statement={["Create a new password.", "Continue your journey with confidence."]} supportingText="Choose a secure new password to protect your account and continue using Workey." title="Choose a new password"><ResetPasswordForm initial={{ deliveryChannel: pending.deliveryChannel, expiresInSeconds: pending.expiresInSeconds, resendInSeconds: pending.resendInSeconds }} /></AuthShell>;
}
