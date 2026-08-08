import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRawRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest, context: { params: Promise<{ cvId: string; document: string }> }) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) { const response = NextResponse.json({ message: "Your session has ended." }, { status: 401, headers: noStore }); response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
  const { cvId, document } = await context.params;
  if (!/^\d+$/.test(cvId) || !["preview", "download"].includes(document)) return NextResponse.json({ message: "CV document not found." }, { status: 404, headers: noStore });
  let backend: Response;
  try {
    backend = await authBackendRawRequest(`cv/${cvId}/download`, { token, language: request.headers.get("accept-language") ?? undefined });
  } catch (error) {
    const status = error instanceof AuthBackendError ? error.status : 503;
    return NextResponse.json({ message: "CV document is temporarily unavailable." }, { status, headers: noStore });
  }
  if (!backend.ok) { const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended." : "CV document is temporarily unavailable." }, { status: backend.status, headers: noStore }); if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
  const headers = new Headers({ ...noStore, "Content-Type": backend.headers.get("content-type") ?? "application/octet-stream" });
  const disposition = backend.headers.get("content-disposition");
  if (document === "preview") headers.set("Content-Disposition", "inline");
  else if (disposition) headers.set("Content-Disposition", disposition);
  return new NextResponse(backend.body, { status: 200, headers });
}
