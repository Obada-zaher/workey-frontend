import "server-only";

import { authBackendRequest } from "@/lib/auth/backend";
import type { JobSeekerProfileDetail } from "@/lib/auth/types";
import type {
  CVAllowedAction,
  CVLabel,
  CVPagination,
  CVWorkflowStatus,
  ProfileCVFile,
  ProfileCVState,
} from "./cv-types";

const workflowLabels: Record<string, string> = {
  confirmed: "Confirmed",
  failed: "Processing failed",
  no_cv: "No CV",
  processing: "Processing",
  review_required: "Review required",
  suggestions_review_required: "Review profile changes",
};

function key(value?: CVLabel | null) {
  return value?.key ?? "";
}

function isComplete(file: ProfileCVFile) {
  return file.confirmed_at !== null || key(file.review_status) === "applied";
}

function actionsFor(file: ProfileCVFile): CVAllowedAction[] {
  const actions: CVAllowedAction[] = ["download_cv", "update_version_label"];
  if (file.can_set_primary) actions.push("make_primary");
  if (file.can_archive) actions.push("archive_cv");
  if (file.can_restore) actions.push("restore_cv");

  switch (key(file.next_action)) {
    case "review_draft":
      actions.push("edit_review_draft", "confirm_cv");
      break;
    case "confirm_cv":
      actions.push("confirm_cv");
      break;
    case "generate_suggestions":
      actions.push("generate_suggestions");
      break;
    case "review_suggestions":
      actions.push("review_suggestions");
      break;
  }
  return actions;
}

function progressFor(file: ProfileCVFile) {
  const parsing = key(file.status);
  const parsed = parsing === "parsed";
  return {
    upload_completed: true,
    text_extracted: parsed,
    parsing_completed: parsed,
    review_completed: parsed && Boolean(key(file.review_mode)),
  };
}

function normalizeFile(file: ProfileCVFile): ProfileCVFile {
  return { ...file, allowed_actions: actionsFor(file), progress: progressFor(file) };
}

function workflowStatus(pending: ProfileCVFile | null, current: ProfileCVFile | null): CVWorkflowStatus {
  if (!pending) return current ? "confirmed" : "no_cv";
  const parsing = key(pending.status);
  const next = key(pending.next_action);
  if (parsing === "failed") return "failed";
  if (parsing === "uploaded" || parsing === "processing" || next === "wait_for_parsing") return "processing";
  if (next === "review_draft") return "review_required";
  if (next === "confirm_cv" || (key(pending.review_mode) === "initial_import" && key(pending.review_status) === "ready_to_apply")) return "review_required";
  if (["generate_suggestions", "review_suggestions", "apply_suggestions"].includes(next)) return "suggestions_review_required";
  return current ? "confirmed" : "no_cv";
}

export function composeProfileCV(
  profile: JobSeekerProfileDetail,
  page: CVPagination,
): JobSeekerProfileDetail {
  const files = page.data.map(normalizeFile);
  const active = files.filter((file) => !file.is_archived);
  const current = active.find((file) => file.is_primary && isComplete(file))
    ?? active.find((file) => isComplete(file))
    ?? null;
  const pending = active.find((file) => !isComplete(file)) ?? null;
  const statusKey = workflowStatus(pending, current);
  const allowedActions: CVAllowedAction[] = ["upload_cv", "manage_cvs"];
  if (current) allowedActions.push("update_cv");
  if (pending?.allowed_actions) allowedActions.push(...pending.allowed_actions);

  const cvState: ProfileCVState = {
    status: { key: statusKey, value: workflowLabels[statusKey] ?? statusKey.replaceAll("_", " ") },
    is_ready: Boolean(current?.can_use_for_application),
    pending_update: pending,
    allowed_actions: [...new Set(allowedActions)],
  };

  return {
    ...profile,
    current_cv: current,
    pending_cv_update: pending,
    cv: cvState,
    cv_files: files,
  };
}

export async function getProfileData(token: string, language?: string) {
  const [profile, cvPage] = await Promise.all([
    authBackendRequest<JobSeekerProfileDetail>("profile", { method: "GET", token, language }),
    authBackendRequest<CVPagination>("cv", {
      method: "GET",
      token,
      language,
      query: { include_archived: true, per_page: 100 },
    }),
  ]);
  return composeProfileCV(profile, cvPage);
}
