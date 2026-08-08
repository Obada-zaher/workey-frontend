import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendFormDataRequest, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function backendPath(parts: string[]) {
  if (!parts.length || parts.some((part) => !/^[a-z0-9-]+$/i.test(part))) return null;
  const [root, ...rest] = parts;
  if (root === "experiences" || root === "education" || root === "skills") return `profile/${[root, ...rest].join("/")}`;
  if (root === "cities" && !rest.length) return "reference/cities";
  if (root === "skill-options" && !rest.length) return "skills";
  if (root === "cv") return [root, ...rest].join("/");
  if (root === "suggestions") return `profile/${[root, ...rest].join("/")}`;
  return null;
}
function failure(error: unknown) { const value = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Profile action is temporarily unavailable."); const response = NextResponse.json({ message: value.status >= 500 ? "Profile action is temporarily unavailable. Please try again." : value.message, code: value.code, errors: value.errors }, { status: value.status, headers: noStore }); if (value.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }, method: Method) {
  const token = request.cookies.get(sessionCookieName)?.value; if (!token) return failure(new AuthBackendError(401, "Your session has ended."));
  const path = backendPath((await context.params).path); if (!path) return NextResponse.json({ message: "Profile action not found." }, { status: 404, headers: noStore });
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if ((method === "POST" || method === "PATCH") && contentType.includes("multipart/form-data")) return NextResponse.json({ data: await authBackendFormDataRequest<unknown>(path, { method, token, language: request.headers.get("accept-language") ?? undefined, formData: await request.formData() }) }, { headers: noStore });
    let body: object | undefined;
    if (method !== "GET" && method !== "DELETE") {
      const text = await request.text();
      if (text.trim()) {
        try { body = JSON.parse(text) as object; }
        catch { return NextResponse.json({ message: "Provide a valid JSON request body." }, { status: 400, headers: noStore }); }
      }
    }
    const query = path === "cv" && method === "GET"
      ? Object.fromEntries(
          ["include_archived", "per_page", "status", "page"].flatMap((key) => {
            const value = request.nextUrl.searchParams.get(key);
            return value === null ? [] : [[key, value]];
          }),
        )
      : undefined;
    return NextResponse.json({ data: await authBackendRequest<unknown>(path, { method, token, body, query, language: request.headers.get("accept-language") ?? undefined }) }, { headers: noStore });
  } catch (error) { return failure(error); }
}
export function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return handle(request, context, "GET"); }
export function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return handle(request, context, "POST"); }
export function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return handle(request, context, "PUT"); }
export function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return handle(request, context, "PATCH"); }
export function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return handle(request, context, "DELETE"); }
