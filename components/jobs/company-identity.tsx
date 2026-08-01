/* eslint-disable @next/next/no-img-element -- Company-logo hosts are supplied dynamically by the API. */

interface CompanyIdentityProps {
  logoUrl?: string | null;
  name: string;
}

export function CompanyIdentity({ logoUrl, name }: CompanyIdentityProps) {
  if (logoUrl) return <span className="job-card__logo"><img alt="" src={logoUrl} /></span>;
  return <span aria-hidden="true" className="job-card__monogram">{name.slice(0, 2).toUpperCase()}</span>;
}
