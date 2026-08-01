import type { ReactNode } from "react";

interface SectionHeadingProps { eyebrow?: string; title: string; description?: string; action?: ReactNode; align?: "left" | "center"; }

export function SectionHeading({ eyebrow, title, description, action, align = "left" }: SectionHeadingProps) {
  const alignment = align === "center" ? " text-center items-center" : " items-start";
  return <div className={`flex flex-col gap-3${alignment}`}>
    {eyebrow ? <p className="type-body-small font-semibold tracking-wide text-secondary">{eyebrow}</p> : null}
    <h2 className="type-heading-1 text-text-primary">{title}</h2>
    {description ? <p className="content-form type-body text-text-secondary">{description}</p> : null}
    {action ? <div className="mt-2">{action}</div> : null}
  </div>;
}
