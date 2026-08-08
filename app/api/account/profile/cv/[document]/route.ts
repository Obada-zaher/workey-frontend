import { NextRequest, NextResponse } from "next/server";
import { authBackendRawRequest } from "@/lib/auth/backend";
import { sessionCookieName } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ document: string }> }) {
  const token = request.cookies.get(sessionCookieName)?.value;
  if (!token) return NextResponse.json({ message: "Your session has ended." }, { status: 401, headers: { "Cache-Control": "no-store, private" } });
  const { document } = await context.params;
  if (document !== "preview" && document !== "download") return NextResponse.json({ message: "Document not found." }, { status: 404 });
  const backend = await authBackendRawRequest(`profile/cv/${document}`, { token, language: request.headers.get("accept-language") ?? undefined });
  if (!backend.ok) return NextResponse.json({ message: "CV document is temporarily unavailable." }, { status: backend.status, headers: { "Cache-Control": "no-store, private" } });
  const headers = new Headers({ "Cache-Control": "no-store, private", "Content-Type": backend.headers.get("content-type") ?? "application/pdf" });
  const disposition = backend.headers.get("content-disposition"); if (disposition) headers.set("Content-Disposition", disposition);
  return new NextResponse(backend.body, { status: 200, headers });
}
