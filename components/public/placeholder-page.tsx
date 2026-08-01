import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export function PlaceholderPage({ title }: { title: string }) { return <main className="flex min-h-screen items-center"><Container><Card className="content-form mx-auto text-center" variant="elevated"><Logo size="large" /><h1 className="type-heading-1 mt-6 text-text-primary">{title}</h1><p className="type-body mt-3 text-text-secondary">This part of the job-seeker experience will be implemented in the next task.</p><Link className="type-body mt-6 inline-block font-semibold" href="/">Return home</Link></Card></Container></main>; }
