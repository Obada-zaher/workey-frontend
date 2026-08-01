"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthClientError, requestPasswordResetCode, resetPassword } from "@/lib/auth/client";
import type { PasswordResetMetadata, ValidationErrors } from "@/lib/auth/types";
import { otpLength, staticDemoOtp } from "@/lib/auth/verification";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./otp-input";
import { PasswordField } from "./password-field";

interface ResetPasswordFormProps { initial: { deliveryChannel: string; expiresInSeconds: number; resendInSeconds: number; }; }
type ResetFields = "otp" | "password" | "password_confirmation";
type FieldErrors = Partial<Record<ResetFields, string>>;

function firstMessage(errors?: ValidationErrors) { return Object.fromEntries(Object.entries(errors ?? {}).map(([field, messages]) => [field, messages[0]])); }
function clock(seconds: number) { const safe = Math.max(0, seconds); return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`; }

export function ResetPasswordForm({ initial }: ResetPasswordFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(initial.expiresInSeconds);
  const [resendIn, setResendIn] = useState(initial.resendInSeconds);
  const [resetPending, setResetPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [attemptsLocked, setAttemptsLocked] = useState(false);

  useEffect(() => { const timer = window.setInterval(() => { setExpiresIn((current) => Math.max(0, current - 1)); setResendIn((current) => Math.max(0, current - 1)); }, 1000); return () => window.clearInterval(timer); }, []);

  function updateError(field: ResetFields) { setErrors((current) => ({ ...current, [field]: undefined })); }
  function applyMetadata(metadata: PasswordResetMetadata) { setExpiresIn(metadata.expires_in_seconds); setResendIn(metadata.retry_after_seconds); setOtp(""); setErrors({}); setFormError(null); setAttemptsLocked(false); }

  async function requestNewCode() {
    setResendPending(true);
    setFormError(null);
    try { applyMetadata((await requestPasswordResetCode()).metadata); } catch (reason) { const authError = reason instanceof AuthClientError ? reason : new AuthClientError(503, "Password reset is temporarily unavailable. Please try again shortly."); setFormError(authError.message); } finally { setResendPending(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!new RegExp(`^\\d{${otpLength}}$`).test(otp)) nextErrors.otp = "Enter all six digits of the reset code.";
    if (!password) nextErrors.password = "Enter a new password.";
    if (password !== confirmation) nextErrors.password_confirmation = "Passwords do not match.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); if (nextErrors.password) requestAnimationFrame(() => document.getElementById("reset-password-password")?.focus()); else if (nextErrors.password_confirmation) requestAnimationFrame(() => document.getElementById("reset-password-confirmation")?.focus()); return; }

    setResetPending(true);
    setFormError(null);
    try {
      await resetPassword({ otp, password, password_confirmation: confirmation });
      setOtp("");
      setPassword("");
      setConfirmation("");
      router.replace("/login?passwordReset=success");
      router.refresh();
    } catch (reason) {
      const authError = reason instanceof AuthClientError ? reason : new AuthClientError(503, "Password reset is temporarily unavailable. Please try again shortly.");
      if (authError.code === "INVALID_OR_EXPIRED_PASSWORD_RESET_OTP") { setOtp(""); setErrors((current) => ({ ...current, otp: "The reset code is invalid or has expired. Request a new code." })); return; }
      if (authError.code === "PASSWORD_RESET_OTP_ATTEMPTS_EXCEEDED") { setAttemptsLocked(true); setFormError("Too many incorrect attempts. Request a new code."); return; }
      const mapped = firstMessage(authError.errors) as FieldErrors;
      if (Object.keys(mapped).length) { setErrors(mapped); if (mapped.password) requestAnimationFrame(() => document.getElementById("reset-password-password")?.focus()); else if (mapped.password_confirmation) requestAnimationFrame(() => document.getElementById("reset-password-confirmation")?.focus()); return; }
      setFormError(authError.message);
    } finally {
      setResetPending(false);
    }
  }

  return <form className="mt-5 grid gap-4" noValidate onSubmit={submit}>{initial.deliveryChannel === "static" ? <p className="radius-medium border border-border-default bg-surface-muted p-3 type-body-small text-text-secondary">Demo reset code: <span className="font-semibold text-text-primary">{staticDemoOtp}</span></p> : null}{formError ? <div aria-live="assertive" className="radius-medium border border-border-danger bg-danger-surface p-4 type-body-small text-danger" role="alert">{formError}</div> : null}<div className="grid gap-3"><p className="type-body-small font-medium text-text-primary">Reset code</p><OtpInput disabled={resetPending || attemptsLocked} error={errors.otp} onChange={(value) => { setOtp(value); updateError("otp"); }} value={otp} />{errors.otp ? <p className="type-body-small text-danger" id="otp-error" role="alert">{errors.otp}</p> : null}</div><div aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 type-body-small text-text-secondary"><span>{expiresIn ? `Code expires in ${clock(expiresIn)}` : "Code has expired. Request a new one to continue."}</span><Button disabled={resendIn > 0 || resendPending} loading={resendPending} onClick={() => void requestNewCode()} size="small" type="button" variant="ghost">{resendIn > 0 ? `Request new code in ${resendIn}s` : "Request new code"}</Button></div><div className="grid items-start gap-4 sm:grid-cols-2"><PasswordField autoComplete="new-password" error={errors.password} id="reset-password-password" label="New password" onChange={(value) => { setPassword(value); updateError("password"); }} value={password} /><PasswordField autoComplete="new-password" error={errors.password_confirmation} id="reset-password-confirmation" label="Confirm new password" onChange={(value) => { setConfirmation(value); updateError("password_confirmation"); }} value={confirmation} /></div><p className="-mt-1 type-body-small text-text-muted">Use a strong password you do not reuse elsewhere.</p><Button disabled={attemptsLocked} fullWidth loading={resetPending} type="submit">Reset password</Button><p className="type-body-small text-text-secondary"><Link className="font-semibold" href="/login">Return to log in</Link></p></form>;
}
