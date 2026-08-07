"use client";

/* eslint-disable @next/next/no-img-element -- Company-logo hosts are supplied dynamically by the API. */

import { useState } from "react";

type CompanyIdentitySize = "small" | "medium" | "large" | "hero";

export function CompanyIdentity({ logoUrl, name, size = "medium" }: { logoUrl?: string | null; name: string; size?: CompanyIdentitySize }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
  if (logoUrl && failedUrl !== logoUrl) return <span className={`company-identity company-identity--${size}`}><img alt={`${name} logo`} loading="lazy" onError={() => setFailedUrl(logoUrl)} src={logoUrl} /></span>;
  return <span aria-label={`${name} initials`} className={`company-identity company-identity--${size} company-identity--monogram`}>{initials}</span>;
}
