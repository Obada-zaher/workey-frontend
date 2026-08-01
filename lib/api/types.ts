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
export interface JobsQuery { search?: string; location?: string; skill?: string; experience_level?: string; employment_type?: string; work_mode?: string; accepting_applications?: boolean; sort_by?: "published_at" | "created_at" | "title" | "application_deadline"; sort_direction?: "asc" | "desc"; per_page?: number; page?: number; }
