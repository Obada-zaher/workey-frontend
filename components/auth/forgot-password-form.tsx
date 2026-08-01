"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthClientError, requestPasswordResetCode } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      requestAnimationFrame(() => document.getElementById("forgot-password-email")?.focus());
      return;
    }

    setPending(true);
    setError(undefined);
    setFormError(null);
    try {
      await requestPasswordResetCode(email.trim());
      router.replace("/reset-password");
      router.refresh();
    } catch (reason) {
      const authError = reason instanceof AuthClientError ? reason : new AuthClientError(503, "Password reset is temporarily unavailable. Please try again shortly.");
      const emailError = authError.errors?.email?.[0];
      if (emailError) setError(emailError); else setFormError(authError.message);
    } finally {
      setPending(false);
    }
  }

  return <form className="mt-5 grid gap-4" noValidate onSubmit={submit}>{formError ? <div aria-live="assertive" className="radius-medium border border-border-danger bg-danger-surface p-4 type-body-small text-danger" role="alert">{formError}</div> : null}<Input autoComplete="email" error={error} id="forgot-password-email" label="Email address" onChange={(event) => { setEmail(event.target.value); setError(undefined); }} required type="email" value={email} /><Button fullWidth loading={pending} type="submit">Send reset code</Button><p className="type-body-small text-text-secondary"><Link className="font-semibold" href="/login">Return to log in</Link></p></form>;
}
