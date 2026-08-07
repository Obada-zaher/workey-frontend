import { NextRequest, NextResponse } from "next/server";
import { AuthBackendError, authBackendFormDataRequest, authBackendRequest } from "@/lib/auth/backend";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/server";
import type { AuthenticatedUser } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, private" };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorResponse(error: unknown) { const authError = error instanceof AuthBackendError ? error : new AuthBackendError(503, "Profile photo is temporarily unavailable."); const response = NextResponse.json({ message: authError.status === 401 ? "Your session has ended. Please log in again." : authError.status >= 500 ? "Profile photo is temporarily unavailable. Please try again shortly." : authError.message, code: authError.code, errors: authError.errors }, { status: authError.status, headers: noStore }); if (authError.status === 401) response.cookies.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 }); return response; }
function tokenFor(request: NextRequest) { const token = request.cookies.get(sessionCookieName)?.value; if (!token) throw new AuthBackendError(401, "Your session has ended."); return token; }
function avatarUrlOf(user: AuthenticatedUser) { if (typeof user.avatar_url === "string" || user.avatar_url === null) return user.avatar_url; throw new AuthBackendError(502, "The account response did not include the updated profile photo."); }

export async function POST(request: NextRequest) {
  let image: File;
  try { const form = await request.formData(); const value = form.get("image"); if (!(value instanceof File)) return NextResponse.json({ message: "Choose a JPG, PNG, or WebP image." }, { status: 400, headers: noStore }); image = value; } catch { return NextResponse.json({ message: "Choose a JPG, PNG, or WebP image." }, { status: 400, headers: noStore }); }
  if (!allowedTypes.has(image.type)) return NextResponse.json({ message: "Choose a JPG, PNG, or WebP image." }, { status: 422, headers: noStore });
  if (image.size > 2 * 1024 * 1024) return NextResponse.json({ message: "Profile photos must be 2 MB or smaller." }, { status: 422, headers: noStore });
  const formData = new FormData(); formData.append("image", image, image.name);
  try { const token = tokenFor(request); const language = request.headers.get("accept-language") ?? undefined; const uploaded = await authBackendFormDataRequest<AuthenticatedUser>("profile/avatar", { method: "POST", formData, token, language }); const uploadedAvatarUrl = avatarUrlOf(uploaded); const currentUser = await authBackendRequest<AuthenticatedUser>("auth/me", { method: "GET", token, language }); if (!uploadedAvatarUrl || avatarUrlOf(currentUser) !== uploadedAvatarUrl) throw new AuthBackendError(502, "Your photo was uploaded, but the current account data did not return it. Please try again shortly."); return NextResponse.json({ data: currentUser }, { headers: noStore }); } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) { try { const token = tokenFor(request); const language = request.headers.get("accept-language") ?? undefined; await authBackendRequest<AuthenticatedUser>("profile/avatar", { method: "DELETE", token, language }); const currentUser = await authBackendRequest<AuthenticatedUser>("auth/me", { method: "GET", token, language }); if (avatarUrlOf(currentUser) !== null) throw new AuthBackendError(502, "Your photo was removed, but the current account data still includes it. Please try again shortly."); return NextResponse.json({ data: currentUser }, { headers: noStore }); } catch (error) { return errorResponse(error); } }
