import "server-only";
import type { ApiEnvelope, AuthenticatedUser, ValidationErrors } from "./types";

const authApiUrl = process.env.NEXT_PUBLIC_API_URL;

export class AuthBackendError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string, public readonly errors?: ValidationErrors, public readonly retryAfterSeconds?: number) { super(message); }
}

function endpoint(path: string, query?: Record<string, string | number | boolean | undefined>) {
  if (!authApiUrl) throw new AuthBackendError(503, "Authentication is temporarily unavailable.");
  try {
    const url = new URL(path.replace(/^\//, ""), `${authApiUrl.replace(/\/$/, "")}/`);
    Object.entries(query ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== "") url.searchParams.set(key, String(value)); });
    return url;
  } catch { throw new AuthBackendError(503, "Authentication is temporarily unavailable."); }
}

function errorsFrom(value: unknown): ValidationErrors | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value as Record<string, unknown>).flatMap(([key, messages]) => Array.isArray(messages) && messages.every((message) => typeof message === "string") ? [[key, messages] as const] : []);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export async function authBackendRequest<T>(path: string, options: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: object; token?: string; language?: string; query?: Record<string, string | number | boolean | undefined>; }) {
  let response: Response;
  try {
    response = await fetch(endpoint(path, options.query), { method: options.method, cache: "no-store", headers: { Accept: "application/json", "Accept-Language": options.language === "ar" ? "ar" : "en", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, ...(options.body ? { body: JSON.stringify(options.body) } : {}) });
  } catch { throw new AuthBackendError(503, "Authentication is temporarily unavailable."); }
  let payload: Partial<ApiEnvelope<T>>;
  try { payload = await response.json() as Partial<ApiEnvelope<T>>; } catch { throw new AuthBackendError(502, "Authentication is temporarily unavailable."); }
  if (!response.ok || !payload.success) throw new AuthBackendError(response.status, typeof payload.message === "string" ? payload.message : "Authentication could not be completed.", typeof payload.code === "string" ? payload.code : undefined, errorsFrom(payload.errors), typeof payload.retry_after_seconds === "number" ? payload.retry_after_seconds : undefined);
  return payload.data as T;
}

export async function authBackendFormDataRequest<T>(path: string, options: { method: "POST" | "PATCH"; formData: FormData; token?: string; language?: string; }) {
  let response: Response;
  try {
    response = await fetch(endpoint(path), { method: options.method, cache: "no-store", headers: { Accept: "application/json", "Accept-Language": options.language === "ar" ? "ar" : "en", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, body: options.formData });
  } catch { throw new AuthBackendError(503, "Profile photo is temporarily unavailable."); }
  let payload: Partial<ApiEnvelope<T>>;
  try { payload = await response.json() as Partial<ApiEnvelope<T>>; } catch { throw new AuthBackendError(502, "Profile photo is temporarily unavailable."); }
  if (!response.ok || !payload.success) throw new AuthBackendError(response.status, typeof payload.message === "string" ? payload.message : "Profile photo could not be updated.", typeof payload.code === "string" ? payload.code : undefined, errorsFrom(payload.errors), typeof payload.retry_after_seconds === "number" ? payload.retry_after_seconds : undefined);
  return payload.data as T;
}

export function isJobSeeker(user: AuthenticatedUser) { return user.role?.key === "job_seeker"; }
