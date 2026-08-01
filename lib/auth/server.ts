import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authBackendRequest, isJobSeeker } from "./backend";
import { safeReturnTo } from "./redirects";
import { routes } from "@/config/routes";
import type { AuthenticatedUser, EmailVerificationMetadata, PasswordResetMetadata, PendingPasswordResetContext, PendingVerificationContext, ResendVerificationMetadata } from "./types";

export const sessionCookieName = "workey_session";
export const sessionCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export const pendingVerificationCookieName = "workey_pending_verification";
export const pendingPasswordResetCookieName = "workey_password_reset_pending";
const pendingCookieOptions = { ...sessionCookieOptions, maxAge: 900 };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function metadataToContext(email: string, metadata: EmailVerificationMetadata | ResendVerificationMetadata, returnTo: string): PendingVerificationContext { const now = Date.now(); return { email: normalizeEmail(email), deliveryChannel: metadata.delivery_channel, expiresAt: now + Math.max(0, metadata.expires_in_seconds) * 1000, resendAvailableAt: now + Math.max(0, metadata.resend_after_seconds) * 1000, returnTo: safeReturnTo(returnTo) }; }
function encodePending(context: PendingVerificationContext) { return Buffer.from(JSON.stringify(context)).toString("base64url"); }
function decodePending(value: string | undefined): PendingVerificationContext | null { if (!value) return null; try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PendingVerificationContext>; if (typeof parsed.email !== "string" || typeof parsed.deliveryChannel !== "string" || typeof parsed.expiresAt !== "number" || typeof parsed.resendAvailableAt !== "number" || typeof parsed.returnTo !== "string") return null; return { email: normalizeEmail(parsed.email), deliveryChannel: parsed.deliveryChannel, expiresAt: parsed.expiresAt, resendAvailableAt: parsed.resendAvailableAt, returnTo: safeReturnTo(parsed.returnTo) }; } catch { return null; } }
export function setPendingVerification(response: NextResponse, email: string, metadata: EmailVerificationMetadata | ResendVerificationMetadata, returnTo: string = routes.authenticatedHome) { response.cookies.set(pendingVerificationCookieName, encodePending(metadataToContext(email, metadata, returnTo)), pendingCookieOptions); }
export function clearPendingVerification(response: NextResponse) { response.cookies.set(pendingVerificationCookieName, "", { ...pendingCookieOptions, maxAge: 0 }); }
export async function getPendingVerification() { return decodePending((await cookies()).get(pendingVerificationCookieName)?.value); }
export async function getPendingVerificationView() { const pending = await getPendingVerification(); if (!pending) return null; const now = Date.now(); return { ...pending, expiresInSeconds: Math.max(0, Math.ceil((pending.expiresAt - now) / 1000)), resendInSeconds: Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000)) }; }

function metadataToPasswordResetContext(email: string, metadata: PasswordResetMetadata): PendingPasswordResetContext { const now = Date.now(); return { email: normalizeEmail(email), deliveryChannel: metadata.delivery_channel, expiresAt: now + Math.max(0, metadata.expires_in_seconds) * 1000, resendAvailableAt: now + Math.max(0, metadata.retry_after_seconds) * 1000 }; }
function encodePendingPasswordReset(context: PendingPasswordResetContext) { return Buffer.from(JSON.stringify(context)).toString("base64url"); }
function decodePendingPasswordReset(value: string | undefined): PendingPasswordResetContext | null { if (!value) return null; try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PendingPasswordResetContext>; if (typeof parsed.email !== "string" || typeof parsed.deliveryChannel !== "string" || typeof parsed.expiresAt !== "number" || typeof parsed.resendAvailableAt !== "number") return null; return { email: normalizeEmail(parsed.email), deliveryChannel: parsed.deliveryChannel, expiresAt: parsed.expiresAt, resendAvailableAt: parsed.resendAvailableAt }; } catch { return null; } }
export function setPendingPasswordReset(response: NextResponse, email: string, metadata: PasswordResetMetadata) { response.cookies.set(pendingPasswordResetCookieName, encodePendingPasswordReset(metadataToPasswordResetContext(email, metadata)), pendingCookieOptions); }
export function clearPendingPasswordReset(response: NextResponse) { response.cookies.set(pendingPasswordResetCookieName, "", { ...pendingCookieOptions, maxAge: 0 }); }
export async function getPendingPasswordReset() { return decodePendingPasswordReset((await cookies()).get(pendingPasswordResetCookieName)?.value); }
export async function getPendingPasswordResetView() { const pending = await getPendingPasswordReset(); if (!pending) return null; const now = Date.now(); return { ...pending, expiresInSeconds: Math.max(0, Math.ceil((pending.expiresAt - now) / 1000)), resendInSeconds: Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000)) }; }

export async function getSessionToken() { return (await cookies()).get(sessionCookieName)?.value ?? null; }
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try { const user = await authBackendRequest<AuthenticatedUser>("auth/me", { method: "GET", token }); return isJobSeeker(user) ? user : null; } catch { return null; }
}
export async function requireJobSeeker(returnTo: string = routes.authenticatedHome) { const user = await getCurrentUser(); if (!user) redirect(`${routes.login}?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`); return user; }
