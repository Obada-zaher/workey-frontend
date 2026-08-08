export interface LocalizedValue { key: string; value: string; }

export interface JobSeekerProfile {
  id: number;
  user_id: number;
  headline: string | null;
  summary: string | null;
  phone: string | null;
  location: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  city?: ProfileCity | null;
  availability_status?: "available_now" | "available_from_date" | "not_available" | null;
  available_from?: string | null;
}

export interface ProfileCity { id: number; code: string; name: string; country_code: string; }
export interface ProfileSource { key: string; value: string; }
export interface ProfileExperience { id: number; title: string; company_name: string; location: string | null; start_date: string | null; end_date: string | null; is_current: boolean; description: string | null; source_type?: ProfileSource; user_verified_at?: string | null; }
export interface ProfileEducation { id: number; institution: string; degree: string | null; field_of_study: string | null; start_date: string | null; end_date: string | null; description: string | null; source_type?: ProfileSource; user_verified_at?: string | null; }
export interface ProfileSkill { id: number; name: string; slug?: string; source_type?: ProfileSource; user_verified_at?: string | null; }
export interface ProfessionalLink { type: { key: string; label: string }; url: string; }
export interface ProfileAttentionItem { attention_key: string; title: string; description: string; priority: number; severity?: { key: string; label: string }; action?: { type?: { key: string; label: string }; target?: Record<string, unknown> }; target?: Record<string, unknown>; }
export type ProfileCVFile = import("@/lib/account/cv-types").CurrentCV | import("@/lib/account/cv-types").PendingCVUpdate;
export type ProfileCVSummary = import("@/lib/account/cv-types").ProfileCVState;
export interface CareerSummary { years_of_experience: number; experiences_count: number; education_count: number; skills_count: number; professional_links_count: number; availability?: { status?: { key: string; label: string }; available_from?: string | null; display_label?: string }; }

export interface JobSeekerProfileDetail extends JobSeekerProfile {
  user?: AuthenticatedUser;
  identity?: { name: string; email: string; headline: string | null; summary: string | null; phone: string | null; location: string | null; city?: ProfileCity | null; avatar?: { type: string; initials: string; url: string | null } };
  career_summary?: CareerSummary;
  professional_profile?: { summary: string | null; phone: string | null; portfolio_url: string | null; linkedin_url: string | null; github_url: string | null };
  experiences?: ProfileExperience[];
  education?: ProfileEducation[];
  skills?: ProfileSkill[];
  professional_links?: ProfessionalLink[];
  profile_completeness?: ProfileCompleteness;
  attention_items?: ProfileAttentionItem[];
  current_cv?: import("@/lib/account/cv-types").CurrentCV | null;
  pending_cv_update?: import("@/lib/account/cv-types").PendingCVUpdate | null;
  cv_files?: import("@/lib/account/cv-types").ProfileCVFile[];
  cv?: ProfileCVSummary | null;
  allowed_actions?: string[];
}

export interface ProfileCompletenessItem { key: string; label: string; target: { type: string; value: string }; }
export interface ProfileCompleteness { percentage: number; is_complete: boolean; completed_items_count?: number; missing_items_count: number; completed_items?: ProfileCompletenessItem[]; missing_items: ProfileCompletenessItem[]; recommended_items?: ProfileCompletenessItem[]; next_item: ProfileCompletenessItem | null; }
export interface HomeAction { type?: string; title?: string; subtitle?: string; deadline?: string | null; date_time?: string | null; target?: { type: string; value?: string; id?: number }; action_label?: string; }
export interface RecommendedJob extends HomeJob { match?: { score?: number | null }; }
export interface JobSeekerHomeData { viewer: { type: "job_seeker"; is_authenticated: true; id: number; name: string; avatar_url: string | null }; profile_completeness: ProfileCompleteness; required_action: HomeAction | null; recommended_jobs: RecommendedJob[]; featured_companies: FeaturedCompany[]; latest_jobs: HomeJob[]; meta?: { recommendations_available?: boolean; recommendations?: { available?: boolean } }; }

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: LocalizedValue;
  status: LocalizedValue;
  email_verified_at: string | null;
  is_email_verified: boolean;
  avatar_url: string | null;
  job_seeker_profile?: JobSeekerProfile;
  created_at: string | null;
}

export interface LoginInput { email: string; password: string; }
export interface RegisterJobSeekerInput { name: string; email: string; phone?: string; password: string; password_confirmation: string; terms_accepted: boolean; }
export interface EmailVerificationMetadata { required: boolean; delivery_channel: string; sent: boolean; expires_in_seconds: number; resend_after_seconds: number; }
export interface ResendVerificationMetadata { delivery_channel: string; sent: boolean; expires_in_seconds: number; resend_after_seconds: number; }
export interface PendingVerificationContext { email: string; deliveryChannel: string; expiresAt: number; resendAvailableAt: number; returnTo: string; }
export interface PasswordResetMetadata { delivery_channel: string; sent: boolean; expires_in_seconds: number; retry_after_seconds: number; }
export interface PendingPasswordResetContext { email: string; deliveryChannel: string; expiresAt: number; resendAvailableAt: number; }
export interface LoginData { token: string; token_type: "Bearer"; user: AuthenticatedUser; }
export interface RegistrationData { user: AuthenticatedUser; email_verification: EmailVerificationMetadata; }
export interface ApiEnvelope<T> { success: boolean; message: string; data: T; code?: string; errors?: Record<string, string[]>; retry_after_seconds?: number; }
export type ValidationErrors = Record<string, string[]>;
import type { FeaturedCompany, HomeJob } from "../api/types";
