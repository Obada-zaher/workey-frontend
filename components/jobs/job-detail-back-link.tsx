"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

export function JobDetailBackLink() {
  const router = useRouter();

  function goBack() {
    const internalReferrer = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (internalReferrer) router.back();
    else router.push(routes.explore);
  }

  return <button className="job-detail__back" onClick={goBack} type="button">← Back</button>;
}
