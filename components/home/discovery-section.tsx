import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";

export function DiscoverySection() { return <Section surface="muted" spacing="compact"><SectionHeading eyebrow="OPPORTUNITY DISCOVERY" title="Find a work style that fits" description="Explore current opportunities, then use the live filters to refine your search." /><div className="ui-card mt-6"><p className="type-heading-3 text-text-primary">Explore current roles</p><p className="type-body-small mt-2 text-text-secondary">Available filters are loaded directly from Workey so every search option stays aligned with current opportunities.</p><Link className="type-body-small mt-4 inline-block font-semibold" href="/explore">Explore all opportunities</Link></div></Section>; }
