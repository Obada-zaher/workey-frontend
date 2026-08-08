import type { Metadata } from "next";
import { ApplicationsWorkspace } from "@/components/applications/applications-workspace";

export const metadata: Metadata = { title: "My Applications | Workey" };
export default function ApplicationsPage() { return <ApplicationsWorkspace />; }
