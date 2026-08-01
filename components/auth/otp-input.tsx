"use client";

import { useEffect, useRef } from "react";
import { otpLength } from "@/lib/auth/verification";

interface OtpInputProps { value: string; onChange: (value: string) => void; disabled?: boolean; error?: string | null; }

export function OtpInput({ disabled = false, error, onChange, value }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: otpLength }, (_, index) => value[index] ?? "");

  useEffect(() => { inputs.current[0]?.focus(); }, []);
  useEffect(() => { if (error) inputs.current[0]?.focus(); }, [error]);

  function commit(next: string[]) { onChange(next.join("").replace(/\D/g, "").slice(0, otpLength)); }
  function fillFrom(index: number, raw: string) { const next = [...digits]; const pasted = raw.replace(/\D/g, "").slice(0, otpLength - index); pasted.split("").forEach((digit, offset) => { next[index + offset] = digit; }); commit(next); const target = Math.min(index + Math.max(pasted.length, 1), otpLength - 1); requestAnimationFrame(() => inputs.current[target]?.focus()); }

  return <div aria-describedby={error ? "otp-error" : undefined} aria-label="Six-digit verification code" className="flex justify-between gap-2 sm:gap-3" role="group">{digits.map((digit, index) => <input aria-invalid={error ? true : undefined} aria-label={`Verification digit ${index + 1} of ${otpLength}`} autoComplete={index === 0 ? "one-time-code" : "off"} className={`auth-otp-input ui-input min-w-0 flex-1 p-0 text-center text-xl font-semibold${error ? " ui-input--error" : ""}`} disabled={disabled} inputMode="numeric" key={index} maxLength={otpLength} onChange={(event) => fillFrom(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !digits[index] && index > 0) { event.preventDefault(); const next = [...digits]; next[index - 1] = ""; commit(next); inputs.current[index - 1]?.focus(); } if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); inputs.current[index - 1]?.focus(); } if (event.key === "ArrowRight" && index < otpLength - 1) { event.preventDefault(); inputs.current[index + 1]?.focus(); } }} onPaste={(event) => { event.preventDefault(); fillFrom(index, event.clipboardData.getData("text")); }} ref={(element) => { inputs.current[index] = element; }} type="text" value={digit} />)}</div>;
}
