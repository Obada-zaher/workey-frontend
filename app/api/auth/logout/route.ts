import { NextRequest, NextResponse } from "next/server";
import { authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
export async function POST(request: NextRequest) { const token = request.cookies.get(sessionCookieName)?.value; if (token) { try { await authBackendRequest<null>("auth/logout", { method: "POST", token, language: request.headers.get("accept-language") ?? undefined }); } catch {} } const response = NextResponse.json({ data: null }, { headers: noStore }); response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
