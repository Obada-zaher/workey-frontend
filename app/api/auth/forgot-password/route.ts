import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { getPendingPasswordReset, setPendingPasswordReset } from "@/lib/auth/server";
import type { PasswordResetMetadata } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };

function errorResponse(error: unknown) {
  const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Password reset is temporarily unavailable.");
  const message = authError.status === 429 ? "Too many password reset requests. Please wait before trying again." : authError.status >= 500 ? "Password reset is temporarily unavailable. Please try again shortly." : authError.message;
  return NextResponse.json({ message, code: authError.code, errors: authError.errors, retry_after_seconds: authError.retryAfterSeconds }, { status: authError.status, headers: noStore });
}

export async function POST(request: NextRequest) {
  let suppliedEmail: string | undefined;

  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body || typeof body !== "object" || Object.keys(body).some((key) => key !== "email") || (body.email !== undefined && typeof body.email !== "string")) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400, headers: noStore });
    suppliedEmail = typeof body.email === "string" ? body.email : undefined;
  } catch {
    // A body is intentionally optional when requesting a new code from secure pending context.
  }

  const pending = await getPendingPasswordReset();
  const email = suppliedEmail ?? pending?.email;
  if (!email) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400, headers: noStore });

  try {
    const metadata = await authBackendRequest<PasswordResetMetadata>("auth/forgot-password", { method: "POST", body: { email }, language: request.headers.get("accept-language") ?? undefined });
    const response = NextResponse.json({ data: { metadata } }, { headers: noStore });
    setPendingPasswordReset(response, email, metadata);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
