"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export function LogoutButton({ compact = false }: { compact?: boolean }) { const router = useRouter(); const [pending, setPending] = useState(false); async function signOut() { setPending(true); try { await logout(); } finally { router.replace(routes.publicHome); router.refresh(); } } return <Button loading={pending} onClick={() => void signOut()} size={compact ? "small" : "medium"} type="button" variant="ghost">Log out</Button>; }
