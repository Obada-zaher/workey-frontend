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
}

export interface JobSeekerProfileDetail extends JobSeekerProfile {
  user?: AuthenticatedUser;
  experiences?: Array<unknown>;
  education?: Array<unknown>;
  skills?: Array<{ id: number; name?: string | null }>;
}

export interface ProfileCompletenessItem { key: string; label: string; target: { type: string; value: string }; }
export interface ProfileCompleteness { percentage: number; is_complete: boolean; missing_items_count: number; missing_items: ProfileCompletenessItem[]; next_item: ProfileCompletenessItem | null; }
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
