import { ApiError, apiErrorForStatus } from "./errors";
import type { ApiEnvelope } from "./types";

interface ApiRequestOptions { signal?: AbortSignal; query?: object; language?: string; }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://workey.onrender.com/api/v1";

function requestUrl(path: string, query?: ApiRequestOptions["query"]): URL {
  const base = new URL(`${apiBaseUrl.replace(/\/$/, "")}/`);
  const url = path.startsWith("/api/") ? new URL(path, base.origin) : new URL(path.replace(/^\//, ""), base);
  for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  return url;
}

export async function get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(requestUrl(path, options.query), { headers: { Accept: "application/json", "Accept-Language": options.language ?? "en" }, signal: options.signal, next: { revalidate: 60 } }); }
  catch (error) { if (error instanceof DOMException && error.name === "AbortError") throw error; throw new ApiError("Unable to reach Workey right now.", "network"); }
  let payload: ApiEnvelope<T>;
  try { payload = (await response.json()) as ApiEnvelope<T>; } catch { throw new ApiError("Workey returned an invalid response.", "invalid_json", response.status); }
  if (!response.ok) throw apiErrorForStatus(response.status, payload.message || "The request could not be completed.");
  if (!payload.success) throw new ApiError(payload.message || "The request could not be completed.", "unknown", response.status);
  return payload.data;
}
