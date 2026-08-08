export interface InterviewLocalizedValue { key: string; value: string; }
export type InterviewStatusKey = "scheduled" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "no_show" | "evaluated";
export type InterviewModeKey = "online" | "on_site" | string;
export interface InterviewCompany { id: number; name: string; industry?: string | null; website?: string | null; location?: string | null; description?: string | null; logo_url?: string | null; cover_url?: string | null; }
export interface InterviewJobPosting { id: number; title: string; location?: string | null; city?: { id?: number; name?: string } | null; work_mode?: InterviewLocalizedValue | null; employment_type?: InterviewLocalizedValue | null; company?: InterviewCompany | null; }
export interface InterviewJobApplication { id: number; job_posting_id?: number; status?: InterviewLocalizedValue | null; job_posting?: InterviewJobPosting | null; created_at?: string | null; updated_at?: string | null; }
export interface InterviewDetails {
  id: number;
  job_application_id: number;
  type: InterviewLocalizedValue;
  interview_type: InterviewLocalizedValue;
  mode: InterviewLocalizedValue;
  interview_mode: InterviewLocalizedValue;
  status: InterviewLocalizedValue & { key: InterviewStatusKey };
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  scheduled_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  location_text?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  video_provider?: string | null;
  embedded_video_available?: boolean;
  candidate_message: string | null;
  candidate_confirmation_status: InterviewLocalizedValue | null;
  candidate_attendance_status: InterviewLocalizedValue | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_message: string | null;
  job_application?: InterviewJobApplication | null;
  created_at: string | null;
  updated_at: string | null;
}
export interface InterviewVideoSession {
  provider: "livekit";
  server_url: string;
  participant_token: string;
  room: { name: string };
  participant: { identity: string; display_name: string; role: "candidate" | "employer" };
  expires_at: string;
  fallback_meeting_link: string | null;
}
export interface InterviewApiErrorBody { message?: string; code?: string; errors?: Record<string, string[]>; }
