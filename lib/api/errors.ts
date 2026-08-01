export type ApiErrorCode = "network" | "invalid_json" | "unauthorized" | "forbidden" | "not_found" | "validation" | "server" | "service_unavailable" | "unknown";

export class ApiError extends Error {
  constructor(message: string, public readonly code: ApiErrorCode, public readonly status?: number) { super(message); this.name = "ApiError"; }
}

export function apiErrorForStatus(status: number, message: string): ApiError {
  const codes: Record<number, ApiErrorCode> = { 401: "unauthorized", 403: "forbidden", 404: "not_found", 422: "validation", 500: "server", 503: "service_unavailable" };
  return new ApiError(message, codes[status] ?? "unknown", status);
}
