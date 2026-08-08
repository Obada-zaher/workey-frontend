import type { CVCancelResult, CVConfirmResult, CVReview, CVReviewDraft, CVSuggestion, CVSuggestionsResult, CVUploadResult, JsonValue } from "./cv-types";
import type { JobSeekerProfileDetail, ValidationErrors } from "@/lib/auth/types";

export class AccountApiError extends Error { constructor(public status: number, message: string, public code?: string, public errors?: ValidationErrors) { super(message); } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/account/profile/${path}`, { cache: "no-store", headers: init?.body instanceof FormData ? { Accept: "application/json" } : { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) }, ...init }); }
  catch { throw new AccountApiError(503, "The CV service is temporarily unavailable."); }
  let payload: { data?: T; message?: unknown; code?: unknown; errors?: unknown };
  try { payload = await response.json() as typeof payload; } catch { throw new AccountApiError(response.status || 502, "The CV service returned an unreadable response."); }
  if (!response.ok) throw new AccountApiError(response.status, typeof payload.message === "string" ? payload.message : "The CV action could not be completed.", typeof payload.code === "string" ? payload.code : undefined, isErrors(payload.errors) ? payload.errors : undefined);
  return payload.data as T;
}
function isErrors(value: unknown): value is ValidationErrors { return Boolean(value && typeof value === "object" && Object.values(value).every((entry) => Array.isArray(entry) && entry.every((message) => typeof message === "string"))); }
const resource = (path: string) => `resources/${path}`;
export function refreshProfile() { return request<JobSeekerProfileDetail>(""); }
export function uploadCV(file: File) { const form = new FormData(); form.append("file", file); return request<CVUploadResult>(resource("cv/upload"), { method: "POST", body: form }); }
export function getCVReview(id: number) { return request<CVReview>(resource(`cv/${id}/review`)); }
export function saveCVReviewDraft(id: number, draft: CVReviewDraft) { return request<CVReview>(resource(`cv/${id}/review-draft`), { method: "PUT", body: JSON.stringify(draft) }); }
export function readyForCVConfirmation(id: number) { return request<CVReview>(resource(`cv/${id}/ready-for-confirmation`), { method: "POST" }); }
export function getCVFinalPreview(id: number) { return request<CVReview>(resource(`cv/${id}/final-preview`)); }
export function getCVSuggestions(id: number) { return request<CVSuggestionsResult>(resource(`cv/${id}/suggestions`)); }
export function generateCVSuggestions(id: number) { return request<CVSuggestionsResult>(resource(`cv/${id}/suggestions/generate`), { method: "POST" }); }
export function acceptCVSuggestion(id: number, editedValue?: JsonValue) { return request<CVSuggestion>(resource(`suggestions/${id}/accept`), { method: "POST", ...(editedValue !== undefined ? { body: JSON.stringify({ edited_value: editedValue }) } : {}) }); }
export function rejectCVSuggestion(id: number) { return request<CVSuggestion>(resource(`suggestions/${id}/reject`), { method: "POST" }); }
export function confirmCV(id: number) { return request<CVConfirmResult>(resource(`cv/${id}/confirm`), { method: "POST" }); }
export function cancelCV(id: number) { return request<CVCancelResult>(resource(`cv/${id}/cancel`), { method: "POST" }); }
