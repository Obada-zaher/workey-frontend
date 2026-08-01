"use client";

import { usePathname, useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  function goBack() {
    if (pathname === routes.authenticatedHome) {
      router.push(routes.authenticatedHome);
      return;
    }

    const sameOriginReferrer = document.referrer.startsWith(window.location.origin);
    if (sameOriginReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(routes.authenticatedHome);
  }

  return (
    <button
      aria-label={pathname === routes.authenticatedHome ? "Return to Workey home" : "Return to Home"}
      className="account-back-button"
      onClick={goBack}
      type="button"
    >
      <span aria-hidden="true">{"\u2039"}</span>
    </button>
  );
}
