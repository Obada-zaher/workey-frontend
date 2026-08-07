"use client";

import { ContextualBackButton } from "@/components/navigation/contextual-back-button";
import { routes } from "@/config/routes";

export function JobDetailBackLink() {
  return <ContextualBackButton className="job-detail__back" fallback={routes.explore} />;
}
