"use client";

import { useRouter } from "next/navigation";

export function ContextualBackButton({ fallback, className = "contextual-back" }: { fallback: string; className?: string }) {
  const router = useRouter();

  function goBack() {
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer?.origin === window.location.origin && window.history.length > 1) {
        router.back();
        return;
      }
    } catch {
      // Use the safe contextual route when the referrer cannot be inspected.
    }
    router.push(fallback);
  }

  return <button aria-label="Back" className={className} onClick={goBack} type="button"><svg aria-hidden="true" fill="none" viewBox="0 0 20 20"><path d="m12.5 4.5-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg><span>Back</span></button>;
}
