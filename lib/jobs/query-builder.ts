import type { JobFilterDefinition, JobFilterPrimitive, JobFilterSchema, JobsQuery } from "@/lib/api/types";

export interface JobRangeFilterValue {
  minimum?: JobFilterPrimitive | null;
  maximum?: JobFilterPrimitive | null;
}

export type AppliedJobFilterValue = JobFilterPrimitive | JobRangeFilterValue | null | undefined;
export type AppliedJobFilters = Record<string, AppliedJobFilterValue>;

export interface JobsQueryState {
  search?: string | null;
  filters?: AppliedJobFilters;
  sort?: string | null;
  page?: number | null;
  perPage?: number | null;
}

function isPrimitive(value: unknown): value is JobFilterPrimitive { return typeof value === "string" || typeof value === "number" || typeof value === "boolean"; }
function isQueryValue(value: unknown) { return isPrimitive(value) && value !== ""; }
function hasValue(value: unknown) { return isQueryValue(value) && value !== false; }
function isRangeValue(value: AppliedJobFilterValue): value is JobRangeFilterValue { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function isVisible(definition: JobFilterDefinition, definitions: JobFilterDefinition[], filters: AppliedJobFilters) {
  const condition = definition.visible_when;
  if (!condition) return true;
  if (condition.operator !== "has_value") return false;
  const controllingFilter = definitions.find((candidate) => candidate.parameter === condition.parameter);
  return controllingFilter ? hasValue(filters[controllingFilter.key]) : false;
}

function addFilterQuery(query: JobsQuery, definition: JobFilterDefinition, value: AppliedJobFilterValue) {
  if (definition.type === "range") {
    if (!isRangeValue(value)) return;
    if (isQueryValue(value.minimum)) query[definition.parameters.minimum] = value.minimum;
    if (isQueryValue(value.maximum)) query[definition.parameters.maximum] = value.maximum;
    return;
  }

  if (definition.type === "boolean") {
    const defaultValue = typeof definition.default === "boolean" ? definition.default : false;
    if (typeof value !== "boolean" || value === defaultValue) return;
    query[definition.parameter] = value;
    return;
  }

  if (!isQueryValue(value) || value === definition.default) return;
  query[definition.parameter] = value;
}

/** Converts schema-driven UI state into only the backend parameters that carry a value. */
export function buildJobsQuery(schema: JobFilterSchema | null, state: JobsQueryState): JobsQuery {
  const query: JobsQuery = {};
  const search = state.search?.trim();
  if (search) query.search = search;

  const filters = state.filters ?? {};
  const definitions = schema?.filters ?? [];
  definitions.forEach((definition) => {
    if (isVisible(definition, definitions, filters)) addFilterQuery(query, definition, filters[definition.key]);
  });

  const selectedSort = schema?.sort_options.find((option) => option.key === state.sort);
  if (selectedSort && !selectedSort.default) {
    Object.entries(selectedSort.parameters ?? {}).forEach(([parameter, value]) => {
      if (isQueryValue(value)) query[parameter] = value;
    });
  }

  if (state.page && state.page > 1) query.page = state.page;
  if (state.perPage && state.perPage > 0) query.per_page = state.perPage;
  return query;
}
