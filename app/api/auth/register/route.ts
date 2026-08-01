import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { setPendingVerification } from "@/lib/auth/server";
import type { RegistrationData } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
function errorResponse(error: unknown) { const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Registration is temporarily unavailable."); const message = authError.status === 429 ? "Too many attempts. Please wait before trying again." : authError.status >= 500 ? "Registration is temporarily unavailable. Please try again shortly." : authError.message; return NextResponse.json({ message, code: authError.code, errors: authError.errors }, { status: authError.status, headers: noStore }); }

export async function POST(request: NextRequest) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Please complete the required registration details." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Please complete the required registration details." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>; const required = ["name", "email", "password", "password_confirmation"];
  if (required.some((key) => typeof input[key] !== "string") || typeof input.terms_accepted !== "boolean" || (input.phone !== undefined && typeof input.phone !== "string") || (input.returnTo !== undefined && typeof input.returnTo !== "string")) return NextResponse.json({ message: "Please complete the required registration details." }, { status: 400, headers: noStore });
  const payload = { name: input.name, email: input.email, password: input.password, password_confirmation: input.password_confirmation, terms_accepted: input.terms_accepted, ...(typeof input.phone === "string" && input.phone.trim() ? { phone: input.phone } : {}) };
  try { const result = await authBackendRequest<RegistrationData>("auth/register/job-seeker", { method: "POST", body: payload, language: request.headers.get("accept-language") ?? undefined }); const response = NextResponse.json({ data: { requires_email_verification: result.email_verification.required } }, { status: 201, headers: noStore }); if (result.email_verification.required) setPendingVerification(response, result.user.email, result.email_verification, typeof input.returnTo === "string" ? input.returnTo : undefined); return response; } catch (error) { return errorResponse(error); }
}
