import Link from "next/link";

interface SectionStateProps { title: string; description: string; resetHref?: string; }
export function SectionState({ title, description, resetHref }: SectionStateProps) { return <div className="ui-card ui-card--muted text-center"><p className="type-heading-3 text-text-primary">{title}</p><p className="type-body-small mt-2 text-text-secondary">{description}</p>{resetHref ? <Link className="type-body-small mt-4 inline-block font-semibold" href={resetHref}>Clear search</Link> : null}</div>; }
