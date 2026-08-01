import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCurrentUser, getPendingVerificationView } from "@/lib/auth/server";
import { maskEmail } from "@/lib/auth/verification";
import { routes } from "@/config/routes";

export default async function VerifyEmailPage() { const pending = await getPendingVerificationView(); if (await getCurrentUser()) redirect(pending?.returnTo ?? routes.authenticatedHome); return <AuthShell description="Confirm your email address to activate your secure Workey job-seeker session." statement={["One quick step.", "Then your Workey journey begins."]} supportingText="Verify your email to activate your account and unlock the complete Workey experience." title="Verify your email"><VerifyEmailForm initial={pending ? { maskedEmail: maskEmail(pending.email), deliveryChannel: pending.deliveryChannel, expiresInSeconds: pending.expiresInSeconds, resendInSeconds: pending.resendInSeconds, returnTo: pending.returnTo } : undefined} /></AuthShell>; }
