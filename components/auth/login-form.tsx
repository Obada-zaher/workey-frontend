"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthClientError, login } from "@/lib/auth/client";
import { safeReturnTo } from "@/lib/auth/redirects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "./password-field";

type LoginFields = "email" | "password";
type FieldErrors = Partial<Record<LoginFields, string>>;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function firstMessage(errors?: Record<string, string[]>) { return Object.fromEntries(Object.entries(errors ?? {}).map(([field, messages]) => [field, messages[0]])); }
function focusField(field: string) { requestAnimationFrame(() => document.getElementById(`login-${field}`)?.focus()); }

export function LoginForm({ initialEmail = "", returnTo }: { initialEmail?: string; returnTo?: string | null }) {
  const router = useRouter(); const [email, setEmail] = useState(initialEmail); const [password, setPassword] = useState(""); const [errors, setErrors] = useState<FieldErrors>({}); const [formError, setFormError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  function update(field: LoginFields, value: string) { if (field === "email") setEmail(value); else setPassword(value); setErrors((current) => ({ ...current, [field]: undefined })); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const nextErrors: FieldErrors = {}; if (!emailPattern.test(email.trim())) nextErrors.email = "Enter a valid email address."; if (!password) nextErrors.password = "Enter your password."; if (Object.keys(nextErrors).length) { setErrors(nextErrors); focusField(Object.keys(nextErrors)[0]); return; } setPending(true); setFormError(null); try { const result = await login({ email: email.trim(), password }, returnTo); if (result.requires_email_verification) { setPassword(""); router.replace("/verify-email"); router.refresh(); return; } router.replace(safeReturnTo(returnTo)); router.refresh(); } catch (reason) { const error = reason instanceof AuthClientError ? reason : new AuthClientError(503, "Authentication is temporarily unavailable."); if (error.code === "EMAIL_NOT_VERIFIED") { setPassword(""); router.replace("/verify-email"); router.refresh(); return; } const mapped = firstMessage(error.errors) as FieldErrors; setErrors(mapped); setPassword(""); setFormError(Object.keys(mapped).length ? null : error.message); if (Object.keys(mapped).length) focusField(Object.keys(mapped)[0]); } finally { setPending(false); } }
  const errorList = Object.entries(errors).filter(([, message]) => message);
  return <form className="mt-5 grid gap-4" noValidate onSubmit={submit}>{formError ? <div aria-live="assertive" className="radius-medium border border-border-danger bg-danger-surface p-4 type-body-small text-danger" role="alert">{formError}</div> : null}{errorList.length > 1 ? <div className="radius-medium border border-border-danger bg-danger-surface p-4 type-body-small text-danger" role="alert"><p className="font-semibold">Please correct the highlighted fields:</p><ul className="mt-2 list-disc ps-5">{errorList.map(([field, message]) => <li key={field}>{message}</li>)}</ul></div> : null}<Input autoComplete="email" error={errors.email} id="login-email" label="Email address" onChange={(event) => update("email", event.target.value)} required type="email" value={email} /><PasswordField autoComplete="current-password" error={errors.password} id="login-password" label="Password" onChange={(value) => update("password", value)} value={password} /><p className="type-body-small"><Link className="font-semibold" href="/forgot-password">Forgot your password?</Link></p><Button fullWidth loading={pending} type="submit">Log in</Button><p className="type-body-small text-text-secondary">New to Workey? <Link className="font-semibold" href="/register">Create your job-seeker account</Link>.</p></form>;
}
