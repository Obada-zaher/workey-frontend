"use client";

import { useEffect, useState } from "react";
import { JobCard } from "@/components/jobs/job-card";
import type { RecommendedJob } from "@/lib/auth/types";

function cardsForViewport() {
  if (window.matchMedia("(max-width: 47.99rem)").matches) return 1;
  if (window.matchMedia("(max-width: 79.99rem)").matches) return 2;
  return 3;
}

export function RecommendedJobsCarousel({ jobs }: { jobs: RecommendedJob[] }) {
  const [cardsPerView, setCardsPerView] = useState(3);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const maxStartIndex = Math.max(0, jobs.length - cardsPerView);
  const canRotate = jobs.length > cardsPerView;
  const startIndex = Math.min(activeIndex, maxStartIndex);

  useEffect(() => {
    const updateViewport = () => setCardsPerView(cardsForViewport());
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);

    updateViewport();
    updateMotion();
    window.addEventListener("resize", updateViewport);
    motionQuery.addEventListener("change", updateMotion);

    return () => {
      window.removeEventListener("resize", updateViewport);
      motionQuery.removeEventListener("change", updateMotion);
    };
  }, []);

  function previous() {
    setActiveIndex((current) => {
      const currentStart = Math.min(current, maxStartIndex);
      return currentStart === 0 ? maxStartIndex : currentStart - 1;
    });
  }

  function next() {
    setActiveIndex((current) => {
      const currentStart = Math.min(current, maxStartIndex);
      return currentStart === maxStartIndex ? 0 : currentStart + 1;
    });
  }

  useEffect(() => {
    if (!canRotate || paused || reducedMotion) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => {
        const currentStart = Math.min(current, maxStartIndex);
        return currentStart === maxStartIndex ? 0 : currentStart + 1;
      });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, canRotate, maxStartIndex, paused, reducedMotion]);

  const visibleJobs = jobs.slice(startIndex, startIndex + cardsPerView);
  const gridClassName = `account-home__recommended-row account-home__recommended-row--${visibleJobs.length}`;

  return (
    <div
      aria-label="Recommended jobs carousel"
      className={`account-home__recommended-carousel${canRotate ? " account-home__recommended-carousel--interactive" : ""}`}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onBlurCapture={() => setPaused(false)}
    >
      {canRotate ? (
        <button
          aria-label="Previous recommended jobs"
          className="account-home__carousel-arrow account-home__carousel-arrow--previous"
          onClick={previous}
          type="button"
        >
          {"\u2039"}
        </button>
      ) : null}
      <div className={gridClassName} key={`${startIndex}-${cardsPerView}`}>
        {visibleJobs.map((job) => (
          <JobCard job={job} key={job.id} variant="compact" />
        ))}
      </div>
      {canRotate ? (
        <button
          aria-label="Next recommended jobs"
          className="account-home__carousel-arrow account-home__carousel-arrow--next"
          onClick={next}
          type="button"
        >
          {"\u203a"}
        </button>
      ) : null}
    </div>
  );
}
