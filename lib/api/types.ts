export interface ApiEnvelope<T> { success: boolean; message: string; data: T; }
export interface LocalizedValue { key: string; value: string; }
export interface GuestViewer { type: "guest"; is_authenticated: false; }
export interface HomeAction { type: "register" | "login"; label: string; }
export interface GuestHero { title: string; description: string; primary_action: HomeAction; secondary_action: HomeAction; }
export interface HomeCompany { id: number | null; name: string | null; logo_url: string | null; }
export interface HomeJob { id: number; title: string; company: HomeCompany; location: string | null; work_mode: LocalizedValue; employment_type: LocalizedValue; published_at: string | null; }
export interface FeaturedCompany { id: number; name: string; logo_url: string | null; industry: string | null; location: string | null; open_jobs_count: number; }
export interface AppFeature { key: string; title: string; description: string; }
export interface GuestHome { viewer: GuestViewer; hero: GuestHero; latest_jobs: HomeJob[]; featured_companies: FeaturedCompany[]; app_features: AppFeature[]; }
export interface Company { id: number; name: string; industry: string | null; location: string | null; }
export interface Skill { id: number; name: string; slug: string; }
export interface Job { id: number; company_id: number; title: string; department: string | null; description: string; employment_type: LocalizedValue; experience_level: LocalizedValue | null; location: string | null; work_mode: LocalizedValue; published_at: string | null; application_deadline: string | null; has_application_deadline: boolean; is_application_deadline_passed: boolean; is_accepting_applications: boolean; can_apply: boolean; company: Company | null; skills: Skill[]; }
export interface PaginationMeta { current_page: number; last_page: number; per_page: number; total: number; }
export interface PaginatedJobs { data: Job[]; meta: PaginationMeta; }
export type JobsQueryValue = string | number | boolean | undefined;
export interface JobsQuery {
  [parameter: string]: JobsQueryValue;
  search?: string;
  location?: string;
  skill?: string;
  experience_level?: string;
  employment_type?: string;
  work_mode?: string;
  accepting_applications?: boolean;
  sort_by?: string;
  sort_direction?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export type JobFilterPrimitive = string | number | boolean;
export type JobFilterOptionValue = string | number;

export interface JobFilterOption {
  key: JobFilterOptionValue;
  value: string;
  [field: string]: unknown;
}

export interface JobFilterOptionsSource {
  endpoint: string;
  search_parameter: string;
  value_field: string;
  label_field: string;
  minimum_search_length: number;
  [field: string]: unknown;
}

export interface JobFilterCondition {
  parameter: string;
  operator: "has_value";
  [field: string]: unknown;
}

interface JobFilterDefinitionBase {
  key: string;
  label: string;
  parameter?: string;
  options?: JobFilterOption[];
  options_source?: JobFilterOptionsSource;
  default?: JobFilterPrimitive | null;
  clearable?: boolean;
  constraints?: Record<string, unknown>;
  visible_when?: JobFilterCondition;
  [field: string]: unknown;
}

export interface JobSingleSelectFilterDefinition extends JobFilterDefinitionBase {
  type: "single_select";
  parameter: string;
  options: JobFilterOption[];
}

export interface JobBooleanFilterDefinition extends JobFilterDefinitionBase {
  type: "boolean";
  parameter: string;
  default?: boolean;
}

export interface JobAutocompleteFilterDefinition extends JobFilterDefinitionBase {
  type: "autocomplete";
  parameter: string;
  options_source: JobFilterOptionsSource;
}

export interface JobRangeFilterDefinition extends JobFilterDefinitionBase {
  type: "range";
  parameters: {
    minimum: string;
    maximum: string;
    [field: string]: string;
  };
}

export type JobFilterDefinition = JobSingleSelectFilterDefinition | JobBooleanFilterDefinition | JobAutocompleteFilterDefinition | JobRangeFilterDefinition;

export interface JobSortOption {
  key: string;
  value: string;
  parameters: Record<string, JobFilterPrimitive>;
  default?: boolean;
  [field: string]: unknown;
}

export interface JobFilterSchema {
  schema_version: 1;
  filters: JobFilterDefinition[];
  sort_options: JobSortOption[];
  [field: string]: unknown;
}

export interface JobRecommendation {
  job: Job;
  score?: number | null;
  matched_skills?: Skill[];
  missing_required_skills?: Skill[];
  reasons?: string[];
  [field: string]: unknown;
}
