import type { JobSeekerProfileDetail } from "@/lib/auth/types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface CVLabel {
  key: string;
  label?: string;
  value?: string;
}

export type CVAllowedAction =
  | "archive_cv"
  | "confirm_cv"
  | "download_cv"
  | "edit_review_draft"
  | "generate_suggestions"
  | "make_primary"
  | "manage_cvs"
  | "restore_cv"
  | "review_suggestions"
  | "update_cv"
  | "update_version_label"
  | "upload_cv";

export interface CVProgress {
  upload_completed: boolean;
  text_extracted: boolean;
  parsing_completed: boolean;
  review_completed: boolean;
}

export interface CVParsingResult {
  id?: number;
  cv_file_id?: number;
  raw_text?: string;
  parsed_json?: JsonValue;
  reviewed_json?: JsonValue;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Mirrors CVFileResource from the backend. Presentation-only fields are optional. */
export interface ProfileCVFile {
  id: number;
  version_label: string | null;
  original_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  parsing_status: CVLabel;
  status: CVLabel;
  review_mode: CVLabel | null;
  review_status: CVLabel | null;
  next_action: CVLabel;
  is_primary: boolean;
  is_archived: boolean;
  can_set_primary: boolean;
  can_archive: boolean;
  can_restore: boolean;
  can_use_for_application: boolean;
  confirmed_at: string | null;
  parsing_result?: CVParsingResult | null;
  parsed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  allowed_actions?: CVAllowedAction[];
  progress?: CVProgress;
}

export interface CVPagination {
  data: ProfileCVFile[];
  links?: Record<string, string | null>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export type CurrentCV = ProfileCVFile;
export type PendingCVUpdate = ProfileCVFile;
export type CVWorkflowStatus =
  | "no_cv"
  | "processing"
  | "review_required"
  | "suggestions_review_required"
  | "confirmed"
  | "failed"
  | string;

export interface ProfileCVState {
  status: CVLabel;
  is_ready: boolean;
  pending_update?: PendingCVUpdate | null;
  allowed_actions: CVAllowedAction[];
}

export interface CVReviewDraftProfile {
  phone: string | null;
  summary: string | null;
  location: string | null;
}

export interface CVReviewExperience {
  id?: number;
  title: string;
  company_name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface CVReviewEducation {
  id?: number;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export interface CVReviewDraft {
  profile: CVReviewDraftProfile;
  experience: CVReviewExperience[];
  education: CVReviewEducation[];
  skills: string[];
}

export interface CVReview {
  cv_file_id: number;
  parsing_status: CVLabel;
  review_mode: CVLabel;
  review_status: CVLabel;
  next_action: CVLabel;
  can_edit_draft: boolean;
  can_confirm: boolean;
  can_generate_suggestions: boolean;
  can_apply_suggestions: boolean;
  editable_sections: string[];
  read_only_sections: string[];
  parsed_json?: JsonValue;
  reviewed_json?: JsonValue;
  reviewed_at: string | null;
}

export type ProfileSuggestionType = "add" | "update" | "merge" | "ignore" | string;
export type ProfileSuggestionStatus = "pending" | "accepted" | "rejected" | "applied" | string;

export interface CVSuggestion {
  id: number;
  user_id: number;
  cv_file_id: number;
  job_seeker_profile_id: number;
  entity_type: CVLabel;
  suggestion_type: CVLabel;
  status: CVLabel;
  source: CVLabel;
  old_value: JsonValue;
  new_value: JsonValue;
  user_edited_value: JsonValue;
  confidence_score: number | null;
  reason: string | null;
  can_accept: boolean;
  can_reject: boolean;
  can_edit: boolean;
  can_apply: boolean;
  is_actionable: boolean;
  display_group: CVLabel;
  applied_at: string | null;
  decided_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type CVUploadResult = ProfileCVFile;
export interface CVConfirmResult {
  profile: JobSeekerProfileDetail;
  suggestions: CVSuggestion[];
}
export type CVSuggestionsResult = CVSuggestion[] | { data: CVSuggestion[] };
export interface CVApplyResult {
  applied_count: number;
  rejected_count: number;
  ignored_count: number;
  already_applied: boolean;
  profile: JobSeekerProfileDetail;
}
