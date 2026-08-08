import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { InterviewDetails } from "@/lib/interviews/types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
function failure(error: unknown) { const backend = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Attendance confirmation is temporarily unavailable."); const response = NextResponse.json({ message: backend.status === 401 ? "Your session has ended. Please log in again." : backend.message, code: backend.code, errors: backend.errors }, { status: backend.status, headers: noStore }); if (backend.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
export async function POST(request: NextRequest, context: { params: Promise<{ interviewId: string }> }) { const { interviewId } = await context.params; const token = request.cookies.get(sessionCookieName)?.value; if (!token) return failure(new AuthBackendError(401, "Your session has ended.")); if (!/^\d+$/.test(interviewId) || Number(interviewId) <= 0) return NextResponse.json({ message: "Interview not found." }, { status: 404, headers: noStore }); try { const data = await authBackendRequest<InterviewDetails>(`interviews/${interviewId}/confirm`, { method: "POST", token, language: request.headers.get("accept-language") ?? undefined }); return NextResponse.json({ data }, { headers: noStore }); } catch (error) { return failure(error); } }
