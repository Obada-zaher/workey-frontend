"use client";

/* eslint-disable @next/next/no-img-element -- Company-logo hosts are supplied dynamically by the API. */

import { useState } from "react";

interface CompanyIdentityProps {
  logoUrl?: string | null;
  name: string;
}

export function CompanyIdentity({ logoUrl, name }: CompanyIdentityProps) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) return <span className="job-card__logo"><img alt={`${name} logo`} loading="lazy" onError={() => setFailed(true)} src={logoUrl} /></span>;
  return <span aria-hidden="true" className="job-card__monogram">{name.slice(0, 2).toUpperCase()}</span>;
}
