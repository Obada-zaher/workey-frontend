"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  AccountApiError,
  archiveCV,
  listCVs,
  makeCVPrimary,
  restoreCV,
  showCV,
  updateCVLabel,
} from "@/lib/account/cv-client";
import type { ProfileCVFile } from "@/lib/account/cv-types";

function label(value?: { label?: string; value?: string; key?: string } | null) {
  return value?.label ?? value?.value ?? value?.key?.replaceAll("_", " ") ?? "Not available";
}

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
    : "Not available";
}

export function CVVersionsModal({
  onClose,
  onComplete,
  onNotice,
}: {
  onClose: () => void;
  onComplete: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [files, setFiles] = useState<ProfileCVFile[]>([]);
  const [detail, setDetail] = useState<ProfileCVFile | null>(null);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [replacements, setReplacements] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<AccountApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listCVs();
      setFiles(page.data);
      setLabels(Object.fromEntries(page.data.map((file) => [file.id, file.version_label ?? ""])));
    } catch (reason) {
      setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "CV versions could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(name: string, operation: () => Promise<unknown>, notice: string) {
    setBusy(name);
    setError(null);
    try {
      await operation();
      await Promise.all([load(), onComplete()]);
      setDetail(null);
      onNotice(notice);
    } catch (reason) {
      setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "The CV version action could not be completed."));
    } finally {
      setBusy(null);
    }
  }

  function openDetails(file: ProfileCVFile) {
    setBusy(`show-${file.id}`);
    setError(null);
    void showCV(file.id)
      .then(setDetail)
      .catch((reason: unknown) => setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "CV details could not be loaded.")))
      .finally(() => setBusy(null));
  }

  function rename(file: ProfileCVFile) {
    const value = labels[file.id]?.trim() || null;
    void run(`rename-${file.id}`, () => updateCVLabel(file.id, value), "CV label updated.");
  }

  function makePrimary(file: ProfileCVFile) {
    if (!window.confirm(`Make “${file.version_label || file.original_name}” your primary CV?`)) return;
    void run(`primary-${file.id}`, () => makeCVPrimary(file.id), "Primary CV updated.");
  }

  function archive(file: ProfileCVFile) {
    const availableReplacements = files.filter((candidate) => candidate.id !== file.id && !candidate.is_archived && candidate.can_use_for_application);
    const replacementId = replacements[file.id];
    if (file.is_primary && availableReplacements.length && !replacementId) {
      setError(new AccountApiError(422, "Choose a replacement primary CV before archiving this version."));
      return;
    }
    if (!window.confirm(`Archive “${file.version_label || file.original_name}”? You can restore it later.`)) return;
    void run(`archive-${file.id}`, () => archiveCV(file.id, replacementId), "CV archived.");
  }

  function restore(file: ProfileCVFile) {
    void run(`restore-${file.id}`, () => restoreCV(file.id), "CV restored.");
  }

  return <Modal className="cv-versions-modal" labelledBy="cv-versions-title" onClose={onClose}>
    <header className="cv-modal-header">
      <div><span className="cv-status-badge">PRIVATE DOCUMENTS</span><h2 id="cv-versions-title">Manage CVs</h2><p>Choose the CV used for applications and keep older versions organized.</p></div>
      <button aria-label="Close CV versions" disabled={Boolean(busy)} onClick={onClose} type="button">×</button>
    </header>
    <div className="cv-modal-content">
      {loading ? <div className="cv-modal-state" role="status"><span className="cv-spinner" />Loading CV versions…</div> : null}
      {error ? <div className="cv-error" role="alert"><strong>{error.message}</strong>{error.code ? <small>Code: {error.code}</small> : null}{error.errors ? <ul>{Object.values(error.errors).flat().map((message) => <li key={message}>{message}</li>)}</ul> : null}</div> : null}
      {!loading && !files.length ? <div className="cv-modal-state">No CV versions have been uploaded yet.</div> : null}
      <div className="cv-version-list">
        {files.map((file) => {
          const availableReplacements = files.filter((candidate) => candidate.id !== file.id && !candidate.is_archived && candidate.can_use_for_application);
          return <article className="cv-version-card" data-archived={file.is_archived} key={file.id}>
            <header>
              <div><span>{file.is_archived ? "ARCHIVED" : file.is_primary ? "PRIMARY CV" : "CV VERSION"}</span><h3>{file.version_label || file.original_name}</h3><p>{file.original_name}</p></div>
              <div className="cv-version-badges"><span>{label(file.status)}</span><span>{label(file.review_status)}</span></div>
            </header>
            <div className="cv-file-meta"><span>{file.extension.toUpperCase()}</span><span>{formatBytes(file.size_bytes)}</span><span>Uploaded {formatDate(file.created_at)}</span>{file.confirmed_at ? <span>Confirmed {formatDate(file.confirmed_at)}</span> : null}</div>
            <p>{file.can_use_for_application ? "Available for job applications" : "Not currently available for job applications"}</p>
            <div className="cv-version-label">
              <label htmlFor={`cv-label-${file.id}`}>Version label</label>
              <div><input id={`cv-label-${file.id}`} maxLength={150} onChange={(event) => setLabels((values) => ({ ...values, [file.id]: event.target.value }))} value={labels[file.id] ?? ""} /><Button disabled={busy !== null || (labels[file.id] ?? "") === (file.version_label ?? "")} loading={busy === `rename-${file.id}`} onClick={() => rename(file)} size="small" type="button" variant="outline">Save label</Button></div>
            </div>
            {file.is_primary && file.can_archive && availableReplacements.length ? <label className="cv-version-replacement"><span>Replacement primary CV</span><select onChange={(event) => setReplacements((values) => ({ ...values, [file.id]: Number(event.target.value) }))} value={replacements[file.id] ?? ""}><option value="">Choose a replacement</option>{availableReplacements.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.version_label || candidate.original_name}</option>)}</select></label> : null}
            <div className="cv-card-actions">
              <Button disabled={busy !== null} loading={busy === `show-${file.id}`} onClick={() => openDetails(file)} size="small" type="button" variant="ghost">Details</Button>
              {file.extension.toLowerCase() === "pdf" ? <a className="ui-button ui-button--outline ui-button--small" href={`/api/account/profile/cv/files/${file.id}/preview`} rel="noreferrer" target="_blank">Preview</a> : null}
              <a className="ui-button ui-button--ghost ui-button--small" href={`/api/account/profile/cv/files/${file.id}/download`}>Download</a>
              {file.can_set_primary ? <Button disabled={busy !== null} loading={busy === `primary-${file.id}`} onClick={() => makePrimary(file)} size="small" type="button">Make primary</Button> : null}
              {file.can_archive ? <Button disabled={busy !== null} loading={busy === `archive-${file.id}`} onClick={() => archive(file)} size="small" type="button" variant="danger">Archive</Button> : null}
              {file.can_restore ? <Button disabled={busy !== null} loading={busy === `restore-${file.id}`} onClick={() => restore(file)} size="small" type="button" variant="outline">Restore</Button> : null}
            </div>
          </article>;
        })}
      </div>
      {detail ? <aside className="cv-version-detail" aria-live="polite"><header><div><span>CV DETAILS</span><h3>{detail.version_label || detail.original_name}</h3></div><button aria-label="Close CV details" onClick={() => setDetail(null)} type="button">×</button></header><dl><div><dt>Parsing status</dt><dd>{label(detail.parsing_status)}</dd></div><div><dt>Review mode</dt><dd>{label(detail.review_mode)}</dd></div><div><dt>Review status</dt><dd>{label(detail.review_status)}</dd></div><div><dt>Next action</dt><dd>{label(detail.next_action)}</dd></div><div><dt>Parsed</dt><dd>{formatDate(detail.parsed_at)}</dd></div><div><dt>Primary</dt><dd>{detail.is_primary ? "Yes" : "No"}</dd></div></dl></aside> : null}
    </div>
    <footer className="cv-modal-footer"><div><small>Archived CVs remain private and downloadable.</small></div><div><Button disabled={Boolean(busy)} onClick={onClose} type="button">Done</Button></div></footer>
  </Modal>;
}
