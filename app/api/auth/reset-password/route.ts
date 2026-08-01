import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { clearPendingPasswordReset, getPendingPasswordReset, sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import { otpLength } from "@/lib/auth/verification";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };

function errorResponse(error: unknown) {
  const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Password reset is temporarily unavailable.");
  const messages: Record<string, string> = {
    INVALID_OR_EXPIRED_PASSWORD_RESET_OTP: "The reset code is invalid or has expired. Request a new code.",
    PASSWORD_RESET_OTP_ATTEMPTS_EXCEEDED: "Too many incorrect attempts. Request a new code.",
    PASSWORD_RESET_RATE_LIMIT_EXCEEDED: "Too many reset attempts. Please wait before trying again.",
    OTP_DRIVER_NOT_AVAILABLE: "Password reset is temporarily unavailable. Please try again shortly.",
  };
  const message = messages[authError.code ?? ""] ?? (authError.status >= 500 ? "Password reset is temporarily unavailable. Please try again shortly." : authError.message);
  return NextResponse.json({ message, code: authError.code, errors: authError.errors, retry_after_seconds: authError.retryAfterSeconds }, { status: authError.status, headers: noStore });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Complete the reset form to continue." }, { status: 400, headers: noStore }); }

  if (!body || typeof body !== "object") return NextResponse.json({ message: "Complete the reset form to continue." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  const keys = ["otp", "password", "password_confirmation"];
  if (Object.keys(input).some((key) => !keys.includes(key)) || keys.some((key) => typeof input[key] !== "string") || !new RegExp(`^\\d{${otpLength}}$`).test(input.otp as string)) return NextResponse.json({ message: "Complete the reset form to continue." }, { status: 422, headers: noStore });

  const pending = await getPendingPasswordReset();
  if (!pending) return NextResponse.json({ message: "Start a password reset request before setting a new password.", code: "PENDING_PASSWORD_RESET_REQUIRED" }, { status: 400, headers: noStore });

  try {
    await authBackendRequest<null>("auth/reset-password", { method: "POST", body: { email: pending.email, otp: input.otp, password: input.password, password_confirmation: input.password_confirmation }, language: request.headers.get("accept-language") ?? undefined });
    const response = NextResponse.json({ data: null }, { headers: noStore });
    clearPendingPasswordReset(response);
    response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
