import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
export default async function RegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) { if (await getCurrentUser()) redirect(routes.authenticatedHome); const params = await searchParams; return <AuthShell description="Start with the essentials. You can build out your profile in a later step." statement={["Build your profile.", "Open the door to better opportunities."]} supportingText="Create your account and start building a professional presence that connects you with suitable opportunities." title="Create your account"><RegisterForm returnTo={first(params.returnTo)} /></AuthShell>; }
