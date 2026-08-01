import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default async function JobDetailCompatibilityPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`${routes.explore}/${encodeURIComponent(jobId)}`);
}
