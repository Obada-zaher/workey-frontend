import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";

const benefits = ["Personalized job recommendations", "CV management and profile guidance", "Application, test, and interview follow-up", "Required-action reminders and notifications"];
export function AccountBenefitsSection() { return <Section surface="muted"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><SectionHeading eyebrow="MORE WITH AN ACCOUNT" title="Keep your career journey in one place" description="Account features support the authenticated job-seeker experience without requiring setup on this public page." /><div className="ui-card ui-card--elevated"><ul className="grid gap-4 type-body text-text-secondary">{benefits.map((benefit) => <li className="flex gap-3" key={benefit}><span className="text-primary" aria-hidden="true">✓</span>{benefit}</li>)}</ul><Link className="ui-button ui-button--primary mt-7" href="/register">Create account</Link></div></div></Section>; }
