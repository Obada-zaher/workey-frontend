import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import type { AppFeature } from "@/lib/api/types";

export function AppFeaturesSection({ features }: { features: AppFeature[] }) { if (!features.length) return null; return <Section><SectionHeading align="center" eyebrow="WORKEY EXPERIENCE" title="Tools for your job-seeker journey" /><div className="mt-8 grid gap-4 md:grid-cols-3">{features.map((feature) => <article className="ui-card" key={feature.key}><p className="type-heading-3 text-text-primary">{feature.title}</p><p className="type-body-small mt-3 text-text-secondary">{feature.description}</p></article>)}</div></Section>; }
