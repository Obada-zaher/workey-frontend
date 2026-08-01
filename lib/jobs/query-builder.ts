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
function isQueryValue(value: unknown): value is JobFilterPrimitive { return isPrimitive(value) && value !== ""; }
function hasValue(value: unknown) { return isQueryValue(value) && value !== false; }
function isRangeValue(value: AppliedJobFilterValue): value is JobRangeFilterValue { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function isJobFilterVisible(definition: JobFilterDefinition, definitions: JobFilterDefinition[], filters: AppliedJobFilters) {
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

  if (!isQueryValue(value) || (definition.default !== null && definition.default !== undefined && String(value) === String(definition.default))) return;
  query[definition.parameter] = value;
}

function defaultValue(definition: JobFilterDefinition): AppliedJobFilterValue {
  if (definition.type === "range") {
    return { minimum: null, maximum: null };
  }

  if (definition.type === "boolean") return typeof definition.default === "boolean" ? definition.default : false;
  return definition.default ?? null;
}

export function defaultJobFilters(schema: JobFilterSchema | null): AppliedJobFilters {
  return Object.fromEntries((schema?.filters ?? []).map((definition) => [definition.key, defaultValue(definition)]));
}

/** Reads filter values with backend parameter names, keeping the schema as the URL contract. */
export function readJobFilters(schema: JobFilterSchema | null, params: Pick<URLSearchParams, "get">): AppliedJobFilters {
  const filters = defaultJobFilters(schema);

  for (const definition of schema?.filters ?? []) {
    if (definition.type === "range") {
      const minimum = params.get(definition.parameters.minimum);
      const maximum = params.get(definition.parameters.maximum);
      filters[definition.key] = { minimum: minimum || null, maximum: maximum || null };
      continue;
    }

    const value = params.get(definition.parameter);
    if (definition.type === "boolean") {
      if (value !== null) filters[definition.key] = value === "true" || value === "1";
      continue;
    }

    if (value) filters[definition.key] = value;
  }

  return filters;
}

/** Removes values for controls hidden by a supported backend visibility condition. */
export function normalizeJobFilters(schema: JobFilterSchema | null, filters: AppliedJobFilters): AppliedJobFilters {
  const definitions = schema?.filters ?? [];
  return Object.fromEntries(definitions.map((definition) => [
    definition.key,
    isJobFilterVisible(definition, definitions, filters) ? filters[definition.key] ?? defaultValue(definition) : defaultValue(definition),
  ]));
}

/** Builds just the dynamic backend filter parameters for URL state and job requests. */
export function buildJobFilterQuery(schema: JobFilterSchema | null, filters: AppliedJobFilters): JobsQuery {
  const query: JobsQuery = {};
  const definitions = schema?.filters ?? [];
  definitions.forEach((definition) => {
    if (isJobFilterVisible(definition, definitions, filters)) addFilterQuery(query, definition, filters[definition.key]);
  });
  return query;
}

/** Converts schema-driven UI state into only the backend parameters that carry a value. */
export function buildJobsQuery(schema: JobFilterSchema | null, state: JobsQueryState): JobsQuery {
  const query: JobsQuery = {};
  const search = state.search?.trim();
  if (search) query.search = search;

  Object.assign(query, buildJobFilterQuery(schema, state.filters ?? {}));

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
