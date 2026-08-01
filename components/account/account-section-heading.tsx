import type { ReactNode } from "react";

export function AccountSectionHeading({ action, description, eyebrow, title }: { action?: ReactNode; description?: string; eyebrow?: string; title: string }) {
  return <header className="account-section-heading"><div>{eyebrow ? <p className="account-section-heading__eyebrow">{eyebrow}</p> : null}<h2 className="type-heading-2 text-text-primary">{title}</h2>{description ? <p className="type-body mt-1 text-text-secondary">{description}</p> : null}</div>{action ? <div className="account-section-heading__action">{action}</div> : null}</header>;
}
