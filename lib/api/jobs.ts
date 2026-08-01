import { get } from "./client";
import type { Job, JobAutocompleteFilterDefinition, JobBooleanFilterDefinition, JobFilterCondition, JobFilterDefinition, JobFilterOption, JobFilterOptionsSource, JobFilterSchema, JobRangeFilterDefinition, JobSingleSelectFilterDefinition, JobSortOption, JobsQuery, PaginatedJobs } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function stringValue(value: unknown): string | null { return typeof value === "string" && value.trim() ? value : null; }
function optionFrom(value: unknown): JobFilterOption | null {
  if (!isRecord(value) || (typeof value.key !== "string" && typeof value.key !== "number") || !stringValue(value.value)) return null;
  return value as JobFilterOption;
}
function conditionFrom(value: unknown): JobFilterCondition | undefined {
  if (!isRecord(value) || !stringValue(value.parameter) || value.operator !== "has_value") return undefined;
  return value as JobFilterCondition;
}
function optionsSourceFrom(value: unknown): JobFilterOptionsSource | null {
  if (!isRecord(value)) return null;
  const endpoint = stringValue(value.endpoint);
  const searchParameter = stringValue(value.search_parameter);
  const valueField = stringValue(value.value_field);
  const labelField = stringValue(value.label_field);
  const minimumSearchLength = value.minimum_search_length;
  if (!endpoint || !searchParameter || !valueField || !labelField || typeof minimumSearchLength !== "number") return null;
  return value as JobFilterOptionsSource;
}

function filterFrom(value: unknown): JobFilterDefinition | null {
  if (!isRecord(value)) return null;
  const key = stringValue(value.key);
  const label = stringValue(value.label);
  const parameter = stringValue(value.parameter);
  const condition = conditionFrom(value.visible_when);
  if (!key || !label) return null;

  if (value.type === "single_select" && parameter && Array.isArray(value.options)) {
    const options = value.options.map(optionFrom).filter((option): option is JobFilterOption => option !== null);
    return { ...value, key, label, parameter, options, ...(condition ? { visible_when: condition } : {}) } as JobSingleSelectFilterDefinition;
  }
  if (value.type === "boolean" && parameter) {
    return { ...value, key, label, parameter, ...(condition ? { visible_when: condition } : {}) } as JobBooleanFilterDefinition;
  }
  if (value.type === "autocomplete" && parameter) {
    const optionsSource = optionsSourceFrom(value.options_source);
    if (!optionsSource) return null;
    return { ...value, key, label, parameter, options_source: optionsSource, ...(condition ? { visible_when: condition } : {}) } as JobAutocompleteFilterDefinition;
  }
  if (value.type === "range" && isRecord(value.parameters)) {
    const minimum = stringValue(value.parameters.minimum);
    const maximum = stringValue(value.parameters.maximum);
    if (!minimum || !maximum) return null;
    return { ...value, key, label, parameters: { ...value.parameters, minimum, maximum } } as JobRangeFilterDefinition;
  }
  return null;
}

function sortFrom(value: unknown): JobSortOption | null {
  if (!isRecord(value)) return null;
  const key = stringValue(value.key);
  const optionValue = stringValue(value.value);
  if (!key || !optionValue || !isRecord(value.parameters)) return null;
  const parameters = Object.fromEntries(Object.entries(value.parameters).filter(([, parameterValue]) => typeof parameterValue === "string" || typeof parameterValue === "number" || typeof parameterValue === "boolean"));
  if (!Object.keys(parameters).length) return null;
  return { ...value, key, value: optionValue, parameters } as JobSortOption;
}

function warnUnsupportedSchema(version: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`Workey job-filter schema version ${String(version)} is not supported.`);
}

function schemaFrom(value: unknown): JobFilterSchema | null {
  if (!isRecord(value) || value.schema_version !== 1) {
    warnUnsupportedSchema(isRecord(value) ? value.schema_version : "unknown");
    return null;
  }
  const filters = Array.isArray(value.filters) ? value.filters.map(filterFrom).filter((filter): filter is JobFilterDefinition => filter !== null) : [];
  const sortOptions = Array.isArray(value.sort_options) ? value.sort_options.map(sortFrom).filter((sort): sort is JobSortOption => sort !== null) : [];
  return { ...value, schema_version: 1, filters, sort_options: sortOptions } as JobFilterSchema;
}

export function getPublicJobs(query: JobsQuery = {}, signal?: AbortSignal, language = "en"): Promise<PaginatedJobs> { return get<PaginatedJobs>("/jobs", { query, signal, language }); }
export function getPublicJob(jobId: string, signal?: AbortSignal, language = "en"): Promise<Job> { return get<Job>(`/jobs/${encodeURIComponent(jobId)}`, { signal, language }); }
export async function getJobFilterSchema(signal?: AbortSignal, language = "en"): Promise<JobFilterSchema | null> { return schemaFrom(await get<unknown>("/reference/job-filters", { signal, language })); }
