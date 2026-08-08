import { NextRequest, NextResponse } from "next/server";
import { authBackendRawRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest, context: { params: Promise<{ cvId: string; document: string }> }) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) { const response = NextResponse.json({ message: "Your session has ended." }, { status: 401, headers: noStore }); response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
  const { cvId, document } = await context.params;
  if (!/^\d+$/.test(cvId) || !["preview", "download"].includes(document)) return NextResponse.json({ message: "CV document not found." }, { status: 404, headers: noStore });
  const backend = await authBackendRawRequest(`cv/${cvId}/${document}`, { token, language: request.headers.get("accept-language") ?? undefined });
  if (!backend.ok) { const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended." : "CV document is temporarily unavailable." }, { status: backend.status, headers: noStore }); if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
  const headers = new Headers({ ...noStore, "Content-Type": backend.headers.get("content-type") ?? "application/octet-stream" });
  const disposition = backend.headers.get("content-disposition"); if (disposition) headers.set("Content-Disposition", disposition);
  return new NextResponse(backend.body, { status: 200, headers });
}
