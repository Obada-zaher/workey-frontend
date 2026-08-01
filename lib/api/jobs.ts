import { get } from "./client";
import type { Job, JobsQuery, PaginatedJobs } from "./types";
export function getPublicJobs(query: JobsQuery = {}, signal?: AbortSignal): Promise<PaginatedJobs> { return get<PaginatedJobs>("/jobs", { query, signal }); }
export function getPublicJob(jobId: string, signal?: AbortSignal): Promise<Job> { return get<Job>(`/jobs/${encodeURIComponent(jobId)}`, { signal }); }
