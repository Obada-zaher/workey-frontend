import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewDetailsWorkspace } from "@/components/interviews/interview-details-workspace";
import { AuthBackendError, getInterviewDetails } from "@/lib/interviews/server";

export const metadata: Metadata = { title: "Interview | Workey" };
export default async function InterviewDetailsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^\d+$/.test(id) || Number(id) <= 0) notFound(); let interview; let loadError: unknown; try { interview = await getInterviewDetails(Number(id)); } catch (error) { loadError = error; } if (loadError instanceof AuthBackendError && loadError.status === 404) notFound(); if (interview) return <InterviewDetailsWorkspace initialInterview={interview} />; const status = loadError instanceof AuthBackendError ? loadError.status : 503; return <InterviewDetailsWorkspace initialError={{ status, message: status === 403 ? "You do not have access to this interview." : "Interview details are temporarily unavailable." }} interviewId={Number(id)} />; }
