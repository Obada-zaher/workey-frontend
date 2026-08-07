"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthClientError, removeAvatar, uploadAvatar } from "@/lib/auth/client";
import { UserAvatar } from "@/components/account/user-avatar";

const maxSize = 2 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AvatarEditor({ avatarUrl, name, onAvatarChange }: { avatarUrl: string | null; name: string; onAvatarChange: (avatarUrl: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  function clearPreview() { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; setPreview(null); }

  async function selectFile(file: File) {
    setError(null); setStatus(null);
    if (!acceptedTypes.has(file.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > maxSize) { setError("Profile photos must be 2 MB or smaller."); return; }
    clearPreview(); const nextPreview = URL.createObjectURL(file); previewUrl.current = nextPreview; setPreview(nextPreview); setPending(true);
    try { const updated = await uploadAvatar(file); onAvatarChange(updated.avatar_url); clearPreview(); setStatus("Profile photo updated."); router.refresh(); }
    catch (reason) { setError(reason instanceof AuthClientError ? reason.message : "Profile photo could not be updated. Please try again shortly."); }
    finally { setPending(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove() {
    setPending(true); setError(null); setStatus(null); clearPreview();
    try { const updated = await removeAvatar(); onAvatarChange(updated.avatar_url); setStatus("Profile photo removed."); router.refresh(); }
    catch (reason) { setError(reason instanceof AuthClientError ? reason.message : "Profile photo could not be removed. Please try again shortly."); }
    finally { setPending(false); }
  }

  return <div className="avatar-editor"><button aria-label="Change profile photo" className="avatar-editor__avatar" disabled={pending} onClick={() => inputRef.current?.click()} type="button"><UserAvatar avatarUrl={preview ?? avatarUrl} name={name} size="large" /></button><input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(file); }} ref={inputRef} type="file" /><div className="avatar-editor__actions"><button className="avatar-editor__change" disabled={pending} onClick={() => inputRef.current?.click()} type="button">{pending ? "Uploading…" : "Change photo"}</button>{avatarUrl ? <button className="avatar-editor__remove" disabled={pending} onClick={() => void remove()} type="button">Remove photo</button> : null}</div>{error ? <p className="avatar-editor__message avatar-editor__message--error" role="alert">{error}</p> : null}{status ? <p className="avatar-editor__message" role="status">{status}</p> : null}</div>;
}
