"use client";

import { useState } from "react";

interface PasswordFieldProps { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: "current-password" | "new-password"; error?: string; description?: string; }

export function PasswordField({ autoComplete, description, error, id, label, onChange, value }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const describedBy = [description ? `${id}-description` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  return <div className="grid gap-2 type-body-small text-text-secondary"><label className="font-medium text-text-primary" htmlFor={id}>{label}</label><div className={`ui-input-wrapper${error ? " ui-input-wrapper--error" : ""}`}><input aria-describedby={describedBy} aria-invalid={error ? true : undefined} autoComplete={autoComplete} className="ui-input" id={id} onChange={(event) => onChange(event.target.value)} type={visible ? "text" : "password"} value={value} /><button aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible} className="auth-password-toggle type-body-small shrink-0 font-semibold text-text-secondary" onClick={() => setVisible((current) => !current)} type="button">{visible ? "Hide" : "Show"}</button></div>{description ? <p id={`${id}-description`}>{description}</p> : null}{error ? <p className="text-danger" id={`${id}-error`} role="alert">{error}</p> : null}</div>;
}
