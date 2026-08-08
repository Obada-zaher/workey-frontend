import type { LocalizedValue } from "@/lib/api/types";

export interface ApplicationCompany { id: number; name: string; logo_url?: string | null; }
export interface ApplicationJobPosting { id: number; title: string; location?: string | null; company?: ApplicationCompany | null; }
export interface ApplicationStatus { key: string; value: string; }
export interface SubmittedCV { id: number; original_name: string; download_url: string; mime_type?: string | null; uploaded_at?: string | null; }
export interface ApplicationStatusHistory { id?: number; status?: LocalizedValue | ApplicationStatus | null; note?: string | null; created_at?: string | null; }
export interface ApplicationInformationRequest { id: number; status?: LocalizedValue | null; due_at?: string | null; is_expired?: boolean; can_respond?: boolean; }
export interface JobApplicationSummary { id: number; status: ApplicationStatus | null; job_posting: ApplicationJobPosting | null; created_at: string | null; updated_at: string | null; requires_action?: boolean; next_action?: LocalizedValue | null; allowed_actions?: string[]; }
export interface JobApplicationDetails extends JobApplicationSummary { selected_cv?: SubmittedCV | null; cover_letter?: string | null; screening_answers?: unknown[]; status_history?: ApplicationStatusHistory[]; latest_information_request?: ApplicationInformationRequest | null; }
export interface ApplicationsMeta { current_page: number; last_page: number; per_page: number; total: number; }
export interface ApplicationsList { data: JobApplicationSummary[]; meta: ApplicationsMeta | null; }
