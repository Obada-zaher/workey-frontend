import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";

const modes = [{ key: "remote", label: "Remote" }, { key: "hybrid", label: "Hybrid" }, { key: "on_site", label: "On-site" }];
export function DiscoverySection() { return <Section surface="muted" spacing="compact"><SectionHeading eyebrow="WAYS TO WORK" title="Find a work style that fits" description="Use confirmed public work-mode filters to explore current opportunities." /><div className="mt-6 flex flex-wrap gap-3">{modes.map((mode) => <Link className="ui-button ui-button--outline" href={`/explore?work_mode=${mode.key}`} key={mode.key}>{mode.label}</Link>)}</div><div className="ui-card mt-8"><p className="type-heading-3 text-text-primary">Explore current roles</p><p className="type-body-small mt-2 text-text-secondary">The public API does not expose featured, urgent, or category collections, so Workey keeps discovery focused on current searchable opportunities.</p><Link className="type-body-small mt-4 inline-block font-semibold" href="/explore">Explore all opportunities</Link></div></Section>; }
