import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/server";
import { routes } from "@/config/routes";

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) { if (await getCurrentUser()) redirect(routes.authenticatedHome); const params = await searchParams; const passwordReset = first(params.passwordReset) === "success"; return <AuthShell description="Log in to continue your job-seeker journey with Workey." statement={["Welcome back.", "Your next opportunity is waiting."]} supportingText="Sign in to manage your profile, discover relevant roles, and continue where you left off." title="Welcome back">{passwordReset ? <p className="radius-medium border border-border-default bg-success-surface p-3 type-body-small text-text-primary" role="status">Your password has been reset. Log in with your new password.</p> : null}<LoginForm initialEmail={first(params.email)} returnTo={first(params.returnTo)} /></AuthShell>; }
