import type { ReactNode } from "react";
import { AuthenticatedHeader } from "@/components/navigation/authenticated-header";
import { AuthenticatedMobileNavigation } from "@/components/navigation/authenticated-mobile-navigation";
import { routes } from "@/config/routes";
import { requireJobSeeker } from "@/lib/auth/server";

export default async function InterviewsLayout({ children }: { children: ReactNode }) { const user = await requireJobSeeker(routes.interviews); return <div className="account-app-shell interview-app-shell min-h-dvh bg-background"><AuthenticatedHeader user={user} /><main className="account-main interview-main">{children}</main><AuthenticatedMobileNavigation /></div>; }
