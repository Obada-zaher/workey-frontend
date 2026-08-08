"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountApiError, refreshProfile, uploadCV } from "@/lib/account/cv-client";
import type { CVWorkflowStatus, ProfileCVFile } from "@/lib/account/cv-types";
import type { JobSeekerProfileDetail } from "@/lib/auth/types";
import { CVVersionsModal } from "./cv-versions-modal";
import { CVWorkflowModal } from "./cv-workflow-modal";

type ModalMode = "review" | "suggestions" | "versions";
const maxSize = 5 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; value >= 1024 && index < units.length; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} ${unit}`;
}

function formatDate(value: string | null) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
    : null;
}

function supportsUpload(file: File) {
  const extensionSupported = /\.(pdf|docx)$/i.test(file.name);
  const mimeSupported = !file.type
    || file.type === "application/pdf"
    || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || file.type === "application/zip";
  return file.size > 0 && file.size <= maxSize && extensionSupported && mimeSupported;
}

function label(value?: { label?: string; value?: string; key?: string } | null) {
  return value?.label ?? value?.value ?? value?.key?.replaceAll("_", " ") ?? null;
}

export function CVControlCenter({
  profile,
  onProfileChange,
  onNotice,
}: {
  profile: JobSeekerProfileDetail;
  onProfileChange: (profile: JobSeekerProfileDetail) => void;
  onNotice: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const polling = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<AccountApiError | null>(null);
  const [modal, setModal] = useState<ModalMode | null>(null);
  const state = (profile.cv?.status?.key ?? (profile.current_cv ? "confirmed" : "no_cv")) as CVWorkflowStatus;
  const pending = profile.pending_cv_update;

  const refresh = useCallback(async () => {
    const next = await refreshProfile();
    if (mounted.current) onProfileChange(next);
    return next;
  }, [onProfileChange]);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    if (state !== "processing") return;
    const poll = async () => {
      if (document.visibilityState !== "visible" || polling.current) return;
      polling.current = true;
      try {
        await refresh();
      } catch {
        // Keep stable profile data visible during a transient polling failure.
      } finally {
        polling.current = false;
      }
    };
    const timer = window.setInterval(() => void poll(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh, state]);

  async function choose(file: File) {
    if (!supportsUpload(file)) {
      setError(new AccountApiError(422, "Choose a non-empty PDF or DOCX file up to 5 MB."));
      return;
    }
    setBusy("upload");
    setError(null);
    try {
      await uploadCV(file);
      await refresh();
      onNotice("CV uploaded. Workey is preparing it for review.");
    } catch (reason) {
      setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "CV could not be uploaded."));
    } finally {
      setBusy(null);
    }
  }

  const canUpload = !pending && Boolean(profile.cv?.allowed_actions?.some((action) => action === "upload_cv" || action === "update_cv"));
  const modalMode: Exclude<ModalMode, "versions"> | null = state === "review_required"
    ? "review"
    : state === "suggestions_review_required" ? "suggestions" : null;
  const stateCopy: Record<string, [string, string]> = {
    processing: ["Your CV is being analyzed", "We are extracting structured information. This page will update automatically when processing finishes."],
    review_required: ["Your CV has been analyzed", "Review the extracted information and explicitly confirm it before anything is added to your profile."],
    suggestions_review_required: ["We found profile differences", "Compare the new CV with your current profile and decide which changes should be applied."],
    failed: ["This CV could not be processed", "The failed version remains available in Manage CVs. Your confirmed profile was not changed."],
    confirmed: ["Your current CV is ready", "This primary CV can be securely previewed, downloaded, or replaced with a newer version."],
    no_cv: ["Build your current CV", "Upload a PDF or DOCX. Workey will extract the information for your review before anything changes."],
  };
  const [title, description] = stateCopy[state]
    ?? [label(profile.cv?.status) ?? "CV workflow", "Continue the workflow action returned by the backend."];

  return <section className={`cv-control-center cv-control-center--${state}`} id="profile-cv">
    <header className="cv-control-center__header">
      <div><p>CV CONTROL CENTER</p><h2>{title}</h2><span>{description}</span></div>
      <div className="cv-control-center__header-actions"><span className="cv-status-badge">{label(profile.cv?.status) ?? state.replaceAll("_", " ")}</span><Button onClick={() => setModal("versions")} size="small" type="button" variant="ghost">Manage CVs</Button></div>
    </header>
    {error ? <div className="cv-control-error" role="alert"><strong>{error.message}</strong>{error.code ? <span>Code: {error.code}</span> : null}{error.errors ? <ul>{Object.values(error.errors).flat().map((message) => <li key={message}>{message}</li>)}</ul> : null}</div> : null}

    {state === "no_cv"
      ? <UploadWorkspace busy={busy === "upload"} inputRef={inputRef} onChoose={choose} />
      : <div className="cv-control-center__workspace">
          {profile.current_cv ? <CurrentCVCard cv={profile.current_cv} /> : null}
          {pending ? <PendingCVCard onContinue={modalMode ? () => setModal(modalMode) : undefined} pending={pending} state={state} /> : null}
          {state === "confirmed" && canUpload ? <div className="cv-update-panel"><div><strong>Keep your CV current</strong><p>Upload a new PDF or DOCX. Your primary CV remains available while you review the new version.</p></div><Button disabled={busy !== null} onClick={() => inputRef.current?.click()} type="button" variant="outline">Update CV</Button></div> : null}
          {!pending && state !== "confirmed" ? <div className="cv-control-empty"><p>No active CV workflow was returned by the backend.</p></div> : null}
        </div>}

    <input accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(file); event.currentTarget.value = ""; }} ref={inputRef} type="file" />
    {modal && modal !== "versions" && pending ? <CVWorkflowModal mode={modal} onClose={() => setModal(null)} onComplete={async () => { await refresh(); }} onNotice={onNotice} pending={pending} /> : null}
    {modal === "versions" ? <CVVersionsModal onClose={() => setModal(null)} onComplete={async () => { await refresh(); }} onNotice={onNotice} /> : null}
  </section>;
}

function UploadWorkspace({
  busy,
  inputRef,
  onChoose,
}: {
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChoose: (file: File) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  return <div className="cv-upload-workspace">
    <div className="cv-upload-copy"><div className="cv-feature-tags"><span>PDF / DOCX</span><span>Maximum 5 MB</span><span>Private &amp; secure</span></div><p>Your upload is workflow input. Profile values are created only after your review and confirmation.</p></div>
    <div className={`cv-dropzone${dragging ? " cv-dropzone--active" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void onChoose(file); }}>
      <span aria-hidden="true">↑</span><strong>Drop your CV here</strong><p>PDF or DOCX, up to 5 MB</p><Button loading={busy} onClick={() => inputRef.current?.click()} type="button">Choose file</Button>
    </div>
  </div>;
}

function CurrentCVCard({ cv }: { cv: ProfileCVFile }) {
  const confirmed = formatDate(cv.confirmed_at);
  return <article className="cv-current-card">
    <header><div><span>PRIMARY CV</span><h3>{cv.version_label || cv.original_name}</h3><p>{cv.original_name}</p></div><span className="cv-ready-mark">✓ Ready</span></header>
    <div className="cv-file-meta"><span>{cv.extension.toUpperCase()}</span><span>{formatBytes(cv.size_bytes)}</span><span>{label(cv.review_status)}</span>{confirmed ? <time dateTime={cv.confirmed_at ?? undefined}>Confirmed {confirmed}</time> : null}</div>
    <p>{cv.can_use_for_application ? "Ready for applications" : "Not currently available for applications"}</p>
    <div className="cv-card-actions">{cv.extension.toLowerCase() === "pdf" ? <a className="ui-button ui-button--outline ui-button--small" href={`/api/account/profile/cv/files/${cv.id}/preview`} rel="noreferrer" target="_blank">Preview</a> : null}<a className="ui-button ui-button--ghost ui-button--small" href={`/api/account/profile/cv/files/${cv.id}/download`}>Download</a></div>
  </article>;
}

function PendingCVCard({
  onContinue,
  pending,
  state,
}: {
  onContinue?: () => void;
  pending: ProfileCVFile;
  state: CVWorkflowStatus;
}) {
  const copy: Record<string, string> = {
    review_required: "Review extracted data",
    suggestions_review_required: label(pending.next_action) ?? "Review profile changes",
  };
  const progress = pending.progress;
  return <article className={`cv-pending-card cv-pending-card--${state}`}>
    <header><div><span>{state === "failed" ? "FAILED VERSION" : "NEW CV VERSION"}</span><h3>{pending.version_label || pending.original_name}</h3><p>{pending.original_name}</p></div><span>{label(pending.status) ?? state.replaceAll("_", " ")}</span></header>
    <div className="cv-file-meta"><span>{pending.extension.toUpperCase()}</span><span>{formatBytes(pending.size_bytes)}</span><span>{label(pending.review_mode)}</span></div>
    <p>Next: {label(pending.next_action)}</p>
    {state === "processing" && progress ? <div className="cv-progress-list" aria-label="CV processing progress">{[["Upload complete", progress.upload_completed], ["Text extracted", progress.text_extracted], ["Parsing complete", progress.parsing_completed], ["Review prepared", progress.review_completed]].map(([name, complete]) => <div data-complete={complete} key={String(name)}><span>{complete ? "✓" : "○"}</span><strong>{name}</strong></div>)}</div> : null}
    {state === "failed" ? <div className="cv-failed-note"><p>Processing failed. Upload a corrected file after archiving this version, or keep it for download.</p></div> : null}
    <div className="cv-card-actions">
      {onContinue ? <Button onClick={onContinue} type="button">{copy[state] ?? "Continue workflow"}</Button> : null}
      {pending.extension.toLowerCase() === "pdf" ? <a className="ui-button ui-button--outline" href={`/api/account/profile/cv/files/${pending.id}/preview`} rel="noreferrer" target="_blank">Preview uploaded file</a> : null}
      <a className="ui-button ui-button--ghost" href={`/api/account/profile/cv/files/${pending.id}/download`}>Download</a>
    </div>
  </article>;
}
