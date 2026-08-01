import { SectionSkeleton } from "@/components/feedback/section-skeleton";
import { Container } from "@/components/layout/container";
export default function Loading() { return <main><Container className="py-12 lg:py-20"><div className="skeleton h-10 w-2/3" /><div className="skeleton mt-5 h-5 w-full max-w-xl" /><div className="skeleton mt-3 h-5 w-3/4" /><div className="skeleton mt-10 h-44" /></Container><Container className="py-12"><SectionSkeleton /></Container></main>; }
