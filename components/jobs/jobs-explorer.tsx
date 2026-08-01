"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { JobFilterDrawer } from "@/components/jobs/job-filter-drawer";
import { JobFilterRenderer } from "@/components/jobs/job-filter-renderer";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { getJobFilterSchema, getPublicJobs } from "@/lib/api/jobs";
import type { Job, JobFilterDefinition, JobFilterSchema, JobRecommendation, PaginationMeta } from "@/lib/api/types";
import { routes } from "@/config/routes";
import { defaultExploreTab, normalizeExploreTab, type ExploreTab } from "@/lib/jobs/explore-state";
import { buildJobFilterQuery, buildJobsQuery, defaultJobFilters, isJobFilterVisible, normalizeJobFilters, readJobFilters, type AppliedJobFilterValue, type AppliedJobFilters, type JobRangeFilterValue } from "@/lib/jobs/query-builder";

const PAGE_SIZE = 12;
export type ExploreSchemaStatus = "ready" | "unsupported" | "failed";

interface ExploreUrlState {
  tab: ExploreTab;
  search: string;
  sort: string;
  page: number;
  filters: AppliedJobFilters;
}

interface JobsExplorerProps {
  authenticated: boolean;
  initialSchema: JobFilterSchema | null;
  initialSchemaStatus: ExploreSchemaStatus;
  initialSchemaError: string | null;
  initialRecommendations: JobRecommendation[] | null;
  initialRecommendationsError: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidJob(value: unknown): value is Job {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.title === "string"
    && value.title.trim().length > 0
    && isRecord(value.work_mode)
    && typeof value.work_mode.value === "string"
    && isRecord(value.employment_type)
    && typeof value.employment_type.value === "string";
}

function isValidPaginationMeta(value: unknown): value is PaginationMeta {
  return isRecord(value)
    && typeof value.current_page === "number"
    && typeof value.last_page === "number"
    && typeof value.per_page === "number"
    && typeof value.total === "number"
    && value.current_page >= 1
    && value.last_page >= 1
    && value.per_page >= 1
    && value.total >= 0;
}

function uniqueJobs(items: readonly unknown[]): Job[] {
  const seen = new Set<number>();
  return items.filter(isValidJob).filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

function normalizeRecommendations(value: unknown): JobRecommendation[] {
  if (!Array.isArray(value)) {
    if (value !== null && process.env.NODE_ENV !== "production") console.warn("Workey Explore ignored an invalid recommendations response.");
    return [];
  }

  const recommendations = value.flatMap((item) => {
    if (!isRecord(item) || !isValidJob(item.job)) return [];
    return [{ ...item, job: item.job } as JobRecommendation];
  });
  if (recommendations.length !== value.length && process.env.NODE_ENV !== "production") console.warn("Workey Explore ignored malformed recommendation items.");
  return recommendations;
}

function uniqueRecommendations(items: JobRecommendation[]): JobRecommendation[] {
  const seen = new Set<number>();
  return items.filter((recommendation) => {
    if (seen.has(recommendation.job.id)) return false;
    seen.add(recommendation.job.id);
    return true;
  });
}

function cloneFilters(filters: AppliedJobFilters): AppliedJobFilters {
  return Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value && typeof value === "object" ? { ...value } : value]));
}

function pageFrom(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function paginationPages(current: number, last: number) {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= last).sort((left, right) => left - right);
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "validation") return "One of the selected search values is no longer valid.";
    if (error.code === "unauthorized" || error.code === "forbidden") return "Your session has expired. Please sign in again to continue.";
    if (error.code === "invalid_json") return "Jobs returned an unexpected response. Please try again.";
    if (error.code === "network" || error.code === "server" || error.code === "service_unavailable") return "Jobs are temporarily unavailable. Please try again shortly.";
    return error.message;
  }
  return "We could not update the opportunities right now.";
}

function JobResultsSkeleton({ cards = 3 }: { cards?: number }) {
  return <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">{Array.from({ length: cards }, (_, index) => <div className="job-card-skeleton skeleton" key={index} />)}</div>;
}

function EmptyPublicResults({ hasCriteria, onClear }: { hasCriteria: boolean; onClear: () => void }) {
  return <div className="ui-card ui-card--muted text-center"><p className="type-heading-3 text-text-primary">{hasCriteria ? "No opportunities match your current filters" : "No opportunities are available right now."}</p><p className="type-body-small mt-2 text-text-secondary">{hasCriteria ? "Clear the search or filters to see all current opportunities." : "Please check back soon as approved roles are published."}</p>{hasCriteria ? <Button className="mt-4" onClick={onClear} size="small" type="button" variant="outline">Clear filters</Button> : null}</div>;
}

function EmptyRecommendations() {
  return <div className="ui-card ui-card--muted text-center"><p className="type-heading-3 text-text-primary">No personalized recommendations are available yet.</p><p className="type-body-small mt-2 text-text-secondary">Complete more of your profile or explore current opportunities while we find a better match.</p><div className="mt-4 flex flex-wrap justify-center gap-3"><Link className="ui-button ui-button--outline ui-button--small" href={routes.profile}>Complete your profile</Link><Link className="ui-button ui-button--primary ui-button--small" href={routes.explore}>Explore all jobs</Link></div></div>;
}

function SearchControl({ initialSearch, onApply }: { initialSearch: string; onApply: (search: string, replace: boolean) => void }) {
  const [draft, setDraft] = useState(initialSearch);
  const skipDebounce = useRef(false);

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    if (draft === initialSearch) return;
    const timer = window.setTimeout(() => onApply(draft, true), 400);
    return () => window.clearTimeout(timer);
  }, [draft, initialSearch, onApply]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    skipDebounce.current = true;
    onApply(draft, false);
  }

  function clear() {
    skipDebounce.current = true;
    setDraft("");
    onApply("", false);
  }

  return (
    <form className="explore-shell__search" onSubmit={submit} role="search">
      <Input
        label="Search opportunities"
        name="search"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search jobs, skills, or companies..."
        trailing={draft ? <button aria-label="Clear search" className="explore-shell__clear-search" onClick={clear} type="button">Clear</button> : null}
        type="search"
        value={draft}
      />
    </form>
  );
}

function FilterPanel({ count, error, filtersEnabled, onChange, onReset, onRetry, onAutocompleteLabel, retrying, schema, status, values }: {
  count: number | null;
  error: string | null;
  filtersEnabled: boolean;
  onChange: (key: string, value: AppliedJobFilterValue) => void;
  onReset: () => void;
  onRetry: () => void;
  onAutocompleteLabel: (key: string, label: string) => void;
  retrying: boolean;
  schema: JobFilterSchema | null;
  status: ExploreSchemaStatus;
  values: AppliedJobFilters;
}) {
  return (
    <div className="explore-shell__filter-panel">
      <div className="explore-shell__filter-heading">
        <div>
          <p className="type-heading-4 text-text-primary">Filters</p>
          <p className="type-body-small mt-2 text-text-secondary">Refine opportunities using the available Workey filters.</p>
        </div>
        {filtersEnabled && count !== null ? <span className="explore-shell__filter-count">{count}</span> : null}
      </div>
      {!filtersEnabled ? <p className="type-body-small mt-5 text-text-secondary">Filters are available in Latest and All Jobs.</p> : status === "failed" ? <div className="mt-5"><p className="type-body-small text-danger" role="status">{error ?? "Filters are temporarily unavailable."}</p><Button className="mt-3" loading={retrying} onClick={onRetry} size="small" type="button" variant="outline">Retry filters</Button></div> : status === "unsupported" ? <p className="type-body-small mt-5 text-text-secondary">Filters are unavailable while this job-search contract is updated.</p> : !schema ? <div aria-label="Loading filters" className="explore-shell__filter-skeleton"><span /><span /><span /><span /></div> : <>
        <JobFilterRenderer onAutocompleteLabel={onAutocompleteLabel} onChange={onChange} schema={schema} values={values} />
        <Button className="explore-shell__filter-reset" onClick={onReset} size="small" type="button" variant="ghost">Reset filters</Button>
      </>}
    </div>
  );
}

interface FilterChip { key: string; label: string; }

function isRange(value: AppliedJobFilterValue): value is JobRangeFilterValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function chipFor(definition: JobFilterDefinition, value: AppliedJobFilterValue, autocompleteLabels: Record<string, string>): string | null {
  if (definition.type === "range") {
    if (!isRange(value) || (!value.minimum && !value.maximum)) return null;
    return `${definition.label}: ${value.minimum ?? "Any"}–${value.maximum ?? "Any"}`;
  }
  if (definition.type === "boolean") {
    const defaultValue = typeof definition.default === "boolean" ? definition.default : false;
    return value === defaultValue ? null : definition.label;
  }
  if (value === null || value === undefined || value === "" || (definition.default !== null && definition.default !== undefined && String(value) === String(definition.default))) return null;
  if (definition.type === "single_select") return definition.options.find((option) => String(option.key) === String(value))?.value ?? null;
  return autocompleteLabels[definition.key] ?? String(value);
}

function activeChips(schema: JobFilterSchema | null, filters: AppliedJobFilters, autocompleteLabels: Record<string, string>): FilterChip[] {
  const definitions = schema?.filters ?? [];
  return definitions.flatMap((definition) => {
    if (!isJobFilterVisible(definition, definitions, filters)) return [];
    const label = chipFor(definition, filters[definition.key], autocompleteLabels);
    return label ? [{ key: definition.key, label }] : [];
  });
}

export function JobsExplorer({ authenticated, initialRecommendations, initialRecommendationsError, initialSchema, initialSchemaError, initialSchemaStatus }: JobsExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [schemaOverride, setSchemaOverride] = useState<JobFilterSchema | null | undefined>(undefined);
  const [schemaStatusOverride, setSchemaStatusOverride] = useState<ExploreSchemaStatus | undefined>(undefined);
  const [schemaErrorOverride, setSchemaErrorOverride] = useState<string | null | undefined>(undefined);
  const [retryingSchema, setRetryingSchema] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AppliedJobFilters>({});
  const [autocompleteLabels, setAutocompleteLabels] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const queryString = searchParams.toString();
  const requestedTab = searchParams.get("tab");
  const activeTab = normalizeExploreTab(requestedTab, authenticated);
  const schema = schemaOverride === undefined ? initialSchema : schemaOverride;
  const schemaStatus = schemaStatusOverride ?? initialSchemaStatus;
  const schemaError = schemaErrorOverride === undefined ? initialSchemaError : schemaErrorOverride;
  const sortFromUrl = searchParams.get("sort") ?? "";
  const availableSortOptions = useMemo(() => schema?.sort_options ?? [], [schema]);
  const defaultTab = defaultExploreTab(authenticated);
  const selectedSort = activeTab === "latest" ? "newest" : availableSortOptions.some((option) => option.key === sortFromUrl) ? sortFromUrl : availableSortOptions.find((option) => option.default)?.key ?? availableSortOptions[0]?.key ?? "";
  const urlFilters = useMemo(() => normalizeJobFilters(schema, readJobFilters(schema, searchParams)), [schema, searchParams]);
  const state = useMemo<ExploreUrlState>(() => ({ tab: activeTab, search: searchParams.get("search") ?? "", sort: selectedSort, page: pageFrom(searchParams.get("page")), filters: urlFilters }), [activeTab, searchParams, selectedSort, urlFilters]);
  const recommendations = useMemo(() => uniqueRecommendations(normalizeRecommendations(initialRecommendations)), [initialRecommendations]);
  const filtersEnabled = activeTab !== "for-you";
  const chips = useMemo(() => activeChips(schema, state.filters, autocompleteLabels), [autocompleteLabels, schema, state.filters]);
  const hasAppliedFilters = useMemo(() => Object.keys(buildJobFilterQuery(schema, state.filters)).length > 0, [schema, state.filters]);

  const navigate = useCallback((next: ExploreUrlState, replace = false, scrollResults = false) => {
    const params = new URLSearchParams();
    if (next.tab !== defaultTab) params.set("tab", next.tab);
    if (next.search.trim()) params.set("search", next.search.trim());
    if (next.tab === "all" && next.sort) params.set("sort", next.sort);
    Object.entries(buildJobFilterQuery(schema, next.filters)).forEach(([parameter, value]) => params.set(parameter, String(value)));
    if (next.page > 1) params.set("page", String(next.page));
    const href = `${routes.explore}${params.size ? `?${params.toString()}` : ""}`;
    startTransition(() => {
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
    if (scrollResults) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior, block: "start" }));
    }
  }, [defaultTab, router, schema, startTransition]);

  useEffect(() => {
    if (requestedTab && requestedTab !== activeTab) navigate({ ...state, tab: activeTab, page: 1 }, true);
  }, [activeTab, navigate, requestedTab, state]);

  useEffect(() => {
    if (!sortFromUrl) return;
    if (activeTab === "latest") {
      navigate({ ...state, sort: "", page: 1 }, true);
      return;
    }
    if (activeTab !== "all" || !availableSortOptions.length || availableSortOptions.some((option) => option.key === sortFromUrl)) return;
    navigate({ ...state, sort: "", page: 1 }, true);
  }, [activeTab, availableSortOptions, navigate, sortFromUrl, state]);

  const loadJobs = useCallback(async () => {
    if (activeTab === "for-you") return;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const id = ++requestId.current;
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const response = await getPublicJobs(buildJobsQuery(schema, { search: state.search, filters: state.filters, sort: activeTab === "latest" ? "newest" : state.sort || null, page: state.page, perPage: PAGE_SIZE }), controller.signal);
      if (id !== requestId.current) return;
      if (!Array.isArray(response.data) || !isValidPaginationMeta(response.meta)) throw new ApiError("Jobs returned an unexpected response.", "invalid_json");
      setJobs(uniqueJobs(response.data));
      setMeta(response.meta);
    } catch (error) {
      if (controller.signal.aborted || id !== requestId.current) return;
      setJobsError(errorMessage(error));
    } finally {
      if (id === requestId.current) setLoadingJobs(false);
    }
  }, [activeTab, schema, state]);

  useEffect(() => {
    // URL-driven result loading owns this pending state; it is not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
    return () => requestController.current?.abort();
  }, [loadJobs]);

  async function retrySchema() {
    setRetryingSchema(true);
    try {
      const nextSchema = await getJobFilterSchema();
      setSchemaOverride(nextSchema);
      setSchemaStatusOverride(nextSchema ? "ready" : "unsupported");
      setSchemaErrorOverride(null);
    } catch (error) {
      setSchemaOverride(null);
      setSchemaStatusOverride("failed");
      setSchemaErrorOverride(errorMessage(error));
    } finally {
      setRetryingSchema(false);
    }
  }

  function changeSearch(search: string, replace: boolean) { navigate({ ...state, search, page: 1 }, replace); }
  function changeTab(tab: ExploreTab) { navigate({ ...state, tab, page: 1, sort: tab === "all" ? state.sort : "" }); }
  function changeSort(sort: string) { navigate({ ...state, sort, page: 1 }); }
  function updateFilters(filters: AppliedJobFilters, replace = false) { navigate({ ...state, filters: normalizeJobFilters(schema, filters), page: 1 }, replace); }
  function changeFilter(key: string, value: AppliedJobFilterValue) { updateFilters({ ...state.filters, [key]: value }); }
  function resetFilters() { updateFilters(defaultJobFilters(schema)); }
  function clearPublicCriteria() { navigate({ ...state, search: "", filters: defaultJobFilters(schema), page: 1 }); }
  function removeFilter(key: string) { updateFilters({ ...state.filters, [key]: defaultJobFilters(schema)[key] }); }
  function openMobileFilters() { setDraftFilters(cloneFilters(state.filters)); setMobileFiltersOpen(true); }
  function updateDraft(key: string, value: AppliedJobFilterValue) { setDraftFilters((current) => normalizeJobFilters(schema, { ...current, [key]: value })); }
  function resetDraft() { setDraftFilters(defaultJobFilters(schema)); }
  function applyDraft() { updateFilters(draftFilters); setMobileFiltersOpen(false); }

  const firstResult = meta && meta.total ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const lastResult = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;
  const pages = meta ? paginationPages(meta.current_page, meta.last_page) : [];
  const tabs: Array<{ key: ExploreTab; label: string }> = authenticated ? [{ key: "for-you", label: "For You" }, { key: "latest", label: "Latest" }, { key: "all", label: "All Jobs" }] : [{ key: "latest", label: "Latest" }, { key: "all", label: "All Jobs" }];
  const showPublicResults = activeTab !== "for-you";
  const resultCount = showPublicResults && meta ? meta.total : null;

  return (
    <div className="explore-shell">
      <aside className="explore-shell__sidebar">
        <FilterPanel count={resultCount} error={schemaError} filtersEnabled={filtersEnabled} onAutocompleteLabel={(key, label) => setAutocompleteLabels((current) => current[key] === label ? current : { ...current, [key]: label })} onChange={changeFilter} onReset={resetFilters} onRetry={() => void retrySchema()} retrying={retryingSchema} schema={schema} status={schemaStatus} values={state.filters} />
      </aside>
      <section className="explore-shell__content">
        <header className="explore-shell__heading">
          <div><p className="type-body-small font-semibold tracking-wide text-secondary">OPPORTUNITY EXPLORER</p><h1 className="type-heading-1 mt-3 text-text-primary">Explore Opportunities</h1><p className="type-body mt-3 text-text-secondary">Discover roles that match your skills, goals, and preferred way of working.</p></div>
          <Button aria-expanded={mobileFiltersOpen} className="explore-shell__filters-button" disabled={!filtersEnabled} onClick={openMobileFilters} size="small" type="button" variant="outline">Filters</Button>
        </header>
        <SearchControl initialSearch={state.search} key={queryString} onApply={changeSearch} />
        <div className="explore-shell__controls">
          <div aria-label="Explore tabs" className="explore-shell__tabs" role="tablist">{tabs.map((tab) => <button aria-controls="explore-results" aria-selected={activeTab === tab.key} className={`explore-shell__tab${activeTab === tab.key ? " explore-shell__tab--active" : ""}`} key={tab.key} onClick={() => changeTab(tab.key)} role="tab" type="button">{tab.label}</button>)}</div>
          {activeTab === "all" && availableSortOptions.length ? <label className="explore-shell__sort"><span>Sort by</span><select className="ui-select" onChange={(event) => changeSort(event.target.value)} value={selectedSort}>{availableSortOptions.map((option) => <option key={option.key} value={option.key}>{option.value}</option>)}</select></label> : null}
          {activeTab === "latest" && availableSortOptions.some((option) => option.key === "newest") ? <p className="type-body-small text-text-secondary">{availableSortOptions.find((option) => option.key === "newest")?.value}</p> : null}
        </div>
        {filtersEnabled && chips.length ? <div aria-label="Applied filters" className="explore-shell__applied-filters">{chips.map((chip) => <button aria-label={`Remove ${chip.label} filter`} key={chip.key} onClick={() => removeFilter(chip.key)} type="button">{chip.label}<span aria-hidden="true">×</span></button>)}<button className="explore-shell__clear-filters" onClick={resetFilters} type="button">Clear all</button></div> : null}
        <div aria-busy={showPublicResults ? loadingJobs || isPending : isPending} aria-live="polite" className="explore-shell__results" id="explore-results" ref={resultsRef}>
          <p className="sr-only">{showPublicResults ? loadingJobs ? "Loading opportunities" : jobsError ? "Job search could not be updated" : meta ? `${meta.total} opportunities available` : "" : initialRecommendationsError ? "Recommendations could not be loaded" : ""}</p>
          {activeTab === "for-you" ? isPending ? <JobResultsSkeleton /> : initialRecommendationsError ? <div className="ui-card ui-card--muted"><p className="type-heading-3 text-text-primary">Recommendations are temporarily unavailable</p><p className="type-body-small mt-2 text-text-secondary">{initialRecommendationsError}</p><Button className="mt-4" onClick={() => router.refresh()} size="small" type="button" variant="outline">Retry recommendations</Button></div> : recommendations.length ? <div className="grid gap-4 md:grid-cols-2">{recommendations.map((recommendation) => <JobCard job={recommendation.job} key={recommendation.job.id} recommendation={recommendation} variant="explore" />)}</div> : <EmptyRecommendations /> : loadingJobs ? <JobResultsSkeleton cards={PAGE_SIZE} /> : jobsError ? <div className="ui-card ui-card--muted"><p className="type-heading-3 text-text-primary">Jobs are temporarily unavailable</p><p className="type-body-small mt-2 text-text-secondary">{jobsError}</p><Button className="mt-4" onClick={() => void loadJobs()} size="small" type="button" variant="outline">Retry jobs</Button></div> : jobs.length ? <div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard job={job} key={job.id} variant="explore" />)}</div> : <EmptyPublicResults hasCriteria={Boolean(state.search.trim() || hasAppliedFilters)} onClear={clearPublicCriteria} />}
        </div>
        {showPublicResults && meta && meta.last_page > 1 ? <nav aria-label="Job results pages" className="explore-shell__pagination"><Button disabled={loadingJobs || meta.current_page <= 1} onClick={() => navigate({ ...state, page: state.page - 1 }, false, true)} size="small" type="button" variant="outline">Previous</Button><span className="type-body-small text-text-secondary">Showing {firstResult}–{lastResult} of {meta.total}</span><div className="hidden items-center gap-2 sm:flex">{pages.map((page) => <Button aria-current={page === meta.current_page ? "page" : undefined} disabled={loadingJobs} key={page} onClick={() => navigate({ ...state, page }, false, true)} size="small" type="button" variant={page === meta.current_page ? "primary" : "outline"}>{page}</Button>)}</div><Button disabled={loadingJobs || meta.current_page >= meta.last_page} onClick={() => navigate({ ...state, page: state.page + 1 }, false, true)} size="small" type="button" variant="outline">Next</Button></nav> : null}
      </section>
      <JobFilterDrawer onClose={() => setMobileFiltersOpen(false)} open={mobileFiltersOpen}>
        <div className="explore-filter-drawer__header"><div><h2 className="type-heading-3">Filters</h2><p className="type-body-small text-text-secondary">Choose filters, then update the results.</p></div><Button aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} size="small" type="button" variant="ghost">Close</Button></div>
        {schema && schemaStatus === "ready" ? <JobFilterRenderer onAutocompleteLabel={(key, label) => setAutocompleteLabels((current) => current[key] === label ? current : { ...current, [key]: label })} onChange={updateDraft} schema={schema} values={draftFilters} /> : <p className="type-body-small text-text-secondary">Filters are temporarily unavailable.</p>}
        <div className="explore-filter-drawer__actions"><Button onClick={resetDraft} type="button" variant="ghost">Reset</Button><Button onClick={applyDraft} type="button">Show Results</Button></div>
      </JobFilterDrawer>
    </div>
  );
}
