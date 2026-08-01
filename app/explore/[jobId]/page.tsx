import { redirect } from "next/navigation";

export default async function ExploreJobDetailCompatibilityPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`/jobs/${encodeURIComponent(jobId)}`);
}
