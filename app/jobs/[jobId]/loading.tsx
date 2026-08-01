import { Container } from "@/components/layout/container";

export default function JobDetailLoading() {
  return <main className="layout-section" aria-busy="true" aria-label="Loading opportunity"><Container><div className="job-detail__loading"><div className="skeleton job-detail__loading-heading" /><div className="skeleton job-detail__loading-meta" /><div className="job-detail__layout"><div className="grid gap-6"><div className="skeleton job-detail__loading-content" /><div className="skeleton job-detail__loading-content" /></div><div className="skeleton job-detail__loading-sidebar" /></div></div></Container></main>;
}
