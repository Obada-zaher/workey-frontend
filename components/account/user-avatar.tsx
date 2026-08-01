"use client";

import { useState } from "react";

type AvatarSize = "small" | "medium" | "large";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

export function UserAvatar({ avatarUrl = null, name, size = "medium" }: { avatarUrl?: string | null; name: string; size?: AvatarSize }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const className = `user-avatar user-avatar--${size}`;

  if (avatarUrl && failedUrl !== avatarUrl) return <span className={className}>
    {/* The backend image URL is dynamic and is not constrained to configured Next image domains. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img alt={`${name} avatar`} loading="lazy" onError={() => setFailedUrl(avatarUrl)} src={avatarUrl} />
  </span>;
  return <span aria-label={`${name} initials`} className={className}>{initials(name)}</span>;
}
