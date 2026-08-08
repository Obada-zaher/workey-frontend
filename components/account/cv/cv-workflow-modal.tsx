"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  AccountApiError,
  acceptCVSuggestion,
  applyCVSuggestions,
  confirmCV,
  generateCVSuggestions,
  getCVReview,
  getCVSuggestions,
  readyCVForConfirmation,
  rejectCVSuggestion,
  saveCVReviewDraft,
} from "@/lib/account/cv-client";
import type {
  CVReview,
  CVReviewDraft,
  CVSuggestion,
  CVSuggestionsResult,
  JsonValue,
  PendingCVUpdate,
} from "@/lib/account/cv-types";
import { CVReviewDraftEditor } from "./cv-review-draft";
import { CVStructuredValue, CVSummaryStats } from "./cv-structured-value";

type WorkflowMode = "review" | "suggestions";
type ReviewStep = "edit" | "confirm";

const emptyDraft = (): CVReviewDraft => ({
  profile: { phone: null, summary: null, location: null },
  experience: [],
  education: [],
  skills: [],
});

function label(value?: { label?: string; value?: string; key?: string } | null) {
  return value?.label ?? value?.value ?? value?.key?.replaceAll("_", " ") ?? "Not available";
}

function suggestionsArray(value: CVSuggestionsResult) {
  return Array.isArray(value) ? value : value.data;
}

function asObject(value: JsonValue | undefined): Record<string, JsonValue> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, JsonValue>
    : null;
}

function normalizeDraft(review: CVReview): CVReviewDraft {
  const source = asObject(review.reviewed_json ?? review.parsed_json);
  if (!source) return emptyDraft();
  const profile = asObject(source.profile) ?? {};
  const experience = Array.isArray(source.experience)
    ? source.experience
    : Array.isArray(source.experiences) ? source.experiences : [];
  const education = Array.isArray(source.education) ? source.education : [];
  const skills = Array.isArray(source.skills) ? source.skills : [];

  return {
    profile: {
      phone: typeof profile.phone === "string" ? profile.phone : null,
      summary: typeof profile.summary === "string" ? profile.summary : null,
      location: typeof profile.location === "string" ? profile.location : null,
    },
    experience: experience.filter((item) => asObject(item)).map((item) => {
      const value = asObject(item)!;
      return {
        title: String(value.title ?? ""),
        company_name: String(value.company_name ?? ""),
        location: typeof value.location === "string" ? value.location : null,
        start_date: typeof value.start_date === "string" ? value.start_date : null,
        end_date: typeof value.end_date === "string" ? value.end_date : null,
        is_current: value.is_current === true,
        description: typeof value.description === "string" ? value.description : null,
      };
    }),
    education: education.filter((item) => asObject(item)).map((item) => {
      const value = asObject(item)!;
      return {
        institution: String(value.institution ?? ""),
        degree: typeof value.degree === "string" ? value.degree : null,
        field_of_study: typeof value.field_of_study === "string" ? value.field_of_study : null,
        start_date: typeof value.start_date === "string" ? value.start_date : null,
        end_date: typeof value.end_date === "string" ? value.end_date : null,
        description: typeof value.description === "string" ? value.description : null,
      };
    }),
    skills: skills.flatMap((item) => {
      if (typeof item === "string") return [item];
      const value = asObject(item);
      return value && typeof value.name === "string" ? [value.name] : [];
    }),
  };
}

export function CVWorkflowModal({
  mode,
  pending,
  onClose,
  onComplete,
  onNotice,
}: {
  mode: WorkflowMode;
  pending: PendingCVUpdate;
  onClose: () => void;
  onComplete: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [review, setReview] = useState<CVReview | null>(null);
  const [draft, setDraft] = useState<CVReviewDraft | null>(null);
  const [suggestions, setSuggestions] = useState<CVSuggestion[]>([]);
  const [reviewStep, setReviewStep] = useState<ReviewStep>("edit");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<AccountApiError | null>(null);
  const [dirty, setDirty] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const safeClose = useCallback(() => {
    if (!dirty || window.confirm("Discard unsaved CV review changes?")) onClose();
  }, [dirty, onClose]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let nextReview = await getCVReview(pending.id);
      setDraft(normalizeDraft(nextReview));
      if (mode === "review" && nextReview.can_confirm) {
        setAcknowledged(false);
        setReviewStep("confirm");
      }
      if (mode === "suggestions") {
        let items = suggestionsArray(await getCVSuggestions(pending.id));
        if (!items.length && nextReview.can_generate_suggestions) {
          items = suggestionsArray(await generateCVSuggestions(pending.id));
          nextReview = await getCVReview(pending.id);
        }
        setSuggestions(items);
      }
      setReview(nextReview);
    } catch (reason) {
      setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "The CV workflow could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [mode, pending.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(name: string, operation: () => Promise<void>) {
    setAction(name);
    setError(null);
    try {
      await operation();
    } catch (reason) {
      setError(reason instanceof AccountApiError
        ? reason
        : new AccountApiError(500, "The CV action could not be completed."));
    } finally {
      setAction(null);
    }
  }

  async function reloadReviewAndSuggestions() {
    const nextReview = await getCVReview(pending.id);
    setReview(nextReview);
    setDraft(normalizeDraft(nextReview));
    setSuggestions(suggestionsArray(await getCVSuggestions(pending.id)));
    await onComplete();
  }

  function saveDraft() {
    if (!draft) return;
    void run("save", async () => {
      const nextReview = await saveCVReviewDraft(pending.id, draft);
      setReview(nextReview);
      setDraft(normalizeDraft(nextReview));
      setDirty(false);
      onNotice("CV review draft saved.");
    });
  }

  function prepareConfirmation() {
    if (!draft) return;
    void run("prepare", async () => {
      await saveCVReviewDraft(pending.id, draft);
      const nextReview = await readyCVForConfirmation(pending.id);
      setReview(nextReview);
      setDraft(normalizeDraft(nextReview));
      setDirty(false);
      setAcknowledged(false);
      setReviewStep("confirm");
      onNotice("Review the final draft, then confirm it explicitly.");
    });
  }

  function decide(suggestion: CVSuggestion, decision: "accept" | "reject", editedValue?: JsonValue) {
    void run(`suggestion-${suggestion.id}`, async () => {
      await (decision === "accept"
        ? acceptCVSuggestion(suggestion.id, editedValue)
        : rejectCVSuggestion(suggestion.id));
      await reloadReviewAndSuggestions();
    });
  }

  function confirmInitialCV() {
    if (!review?.can_confirm || !acknowledged) return;
    void run("confirm", async () => {
      await confirmCV(pending.id);
      await onComplete();
      onNotice("Your reviewed CV was confirmed and its approved data is now in your profile.");
      onClose();
    });
  }

  function applySuggestions() {
    if (!review?.can_apply_suggestions) return;
    void run("apply", async () => {
      const result = await applyCVSuggestions(pending.id);
      await onComplete();
      onNotice(result.already_applied
        ? "These profile decisions were already applied."
        : `${result.applied_count} approved change${result.applied_count === 1 ? "" : "s"} applied. ${result.rejected_count} kept unchanged.`);
      onClose();
    });
  }

  const confirming = mode === "review" && reviewStep === "confirm";
  const title = mode === "suggestions"
    ? "Review suggested changes"
    : confirming ? "Review and confirm" : "Initial CV review";

  return <Modal className="cv-workflow-modal" labelledBy="cv-workflow-title" onClose={safeClose}>
    <header className="cv-modal-header">
      <div>
        <span className="cv-status-badge">{label(review?.review_status ?? pending.review_status)}</span>
        <h2 id="cv-workflow-title">{title}</h2>
        <p>{mode === "suggestions"
          ? "Only changes you approve will be applied to your profile."
          : confirming
            ? "This is the reviewed draft that will populate your profile."
            : "Review extracted information before anything becomes live profile data."}</p>
      </div>
      <button aria-label="Close CV workflow" disabled={Boolean(action)} onClick={safeClose} type="button">×</button>
    </header>

    <div className="cv-modal-content">
      {loading ? <div className="cv-modal-state" role="status"><span className="cv-spinner" />Loading CV workflow…</div> : null}
      {error ? <CVError error={error} onRefresh={load} refreshing={Boolean(action)} /> : null}
      {review && !loading ? <>
        <WorkflowDetails review={review} />
        {mode === "review" && !confirming && draft
          ? <CVReviewDraftEditor draft={draft} editableSections={review.editable_sections} errors={error?.errors} onChange={(value) => { setDraft(value); setDirty(true); }} />
          : null}
        {confirming && draft
          ? <FinalReview acknowledged={acknowledged} draft={draft} onAcknowledged={setAcknowledged} />
          : null}
        {mode === "suggestions"
          ? <SuggestionsReview busy={action} onDecision={decide} suggestions={suggestions} />
          : null}
      </> : null}
    </div>

    {!loading && review ? <footer className="cv-modal-footer">
      <div>{review.reviewed_at ? <time dateTime={review.reviewed_at}>Last reviewed {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(review.reviewed_at))}</time> : null}</div>
      <div>
        <Button disabled={Boolean(action)} onClick={safeClose} type="button" variant="ghost">Close</Button>
        {mode === "review" && !confirming ? <>
          <Button disabled={Boolean(action)} loading={action === "save"} onClick={saveDraft} type="button" variant="outline">Save draft</Button>
          <Button disabled={Boolean(action) || !review.can_edit_draft} loading={action === "prepare"} onClick={prepareConfirmation} type="button">Review final draft</Button>
        </> : null}
        {confirming ? <>
          {review.can_edit_draft ? <Button disabled={Boolean(action)} onClick={() => setReviewStep("edit")} type="button" variant="outline">Back to edit</Button> : null}
          <Button disabled={Boolean(action) || !acknowledged || !review.can_confirm} loading={action === "confirm"} onClick={confirmInitialCV} type="button">Confirm CV</Button>
        </> : null}
        {mode === "suggestions" ? <Button disabled={!review.can_apply_suggestions} loading={action === "apply"} onClick={applySuggestions} type="button">Apply approved changes</Button> : null}
      </div>
    </footer> : null}
  </Modal>;
}

function CVError({ error, onRefresh, refreshing }: { error: AccountApiError; onRefresh: () => void; refreshing: boolean }) {
  return <div className="cv-error" role="alert">
    <strong>{error.message}</strong>
    {error.code ? <small>Code: {error.code}</small> : null}
    {error.errors ? <ul>{Object.values(error.errors).flat().map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul> : null}
    <Button loading={refreshing} onClick={onRefresh} size="small" type="button" variant="outline">Try again</Button>
  </div>;
}

function WorkflowDetails({ review }: { review: CVReview }) {
  return <details className="cv-workflow-details">
    <summary>Workflow details</summary>
    <div className="cv-detail-grid">
      {[
        ["Parsing", label(review.parsing_status)],
        ["Review mode", label(review.review_mode)],
        ["Review status", label(review.review_status)],
        ["Next action", label(review.next_action)],
      ].map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}
    </div>
  </details>;
}

function SuggestionsReview({
  busy,
  onDecision,
  suggestions,
}: {
  busy: string | null;
  onDecision: (suggestion: CVSuggestion, decision: "accept" | "reject", editedValue?: JsonValue) => void;
  suggestions: CVSuggestion[];
}) {
  return <section className="cv-suggestions">
    <div className="cv-callout">Information missing from the uploaded CV is kept in your profile; absence is not treated as a deletion.</div>
    {suggestions.length
      ? suggestions.map((suggestion) => <SuggestionCard busy={busy === `suggestion-${suggestion.id}`} key={suggestion.id} onDecision={onDecision} suggestion={suggestion} />)
      : <div className="cv-modal-state">No profile differences were found. The workflow is ready to apply.</div>}
  </section>;
}

function SuggestionCard({
  busy,
  onDecision,
  suggestion,
}: {
  busy: boolean;
  onDecision: (suggestion: CVSuggestion, decision: "accept" | "reject", editedValue?: JsonValue) => void;
  suggestion: CVSuggestion;
}) {
  const proposed = suggestion.user_edited_value ?? suggestion.new_value;
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(() => JSON.stringify(proposed, null, 2));
  const [editError, setEditError] = useState<string | null>(null);

  function acceptEdited() {
    try {
      const value = JSON.parse(edited) as JsonValue;
      setEditError(null);
      onDecision(suggestion, "accept", value);
    } catch {
      setEditError("Enter valid JSON matching the proposed value structure.");
    }
  }

  return <article className={`cv-suggestion cv-suggestion--${suggestion.suggestion_type.key}`}>
    <header>
      <span>{label(suggestion.suggestion_type)}</span>
      <div><strong>{label(suggestion.display_group)}</strong><small>{label(suggestion.status)}</small></div>
    </header>
    <div className="cv-comparison">
      <section><h4>Current</h4><CVStructuredValue value={suggestion.old_value} /></section>
      <section><h4>Proposed</h4><CVStructuredValue value={proposed} /></section>
    </div>
    {suggestion.reason ? <p className="cv-muted">{suggestion.reason}</p> : null}
    {typeof suggestion.confidence_score === "number" ? <p className="cv-muted">Confidence {Math.round(suggestion.confidence_score * 100)}%</p> : null}
    {editing ? <label className="cv-edit-value">
      <span>Edit proposed value (JSON)</span>
      <textarea aria-invalid={Boolean(editError)} onChange={(event) => setEdited(event.target.value)} rows={6} value={edited} />
      {editError ? <small role="alert">{editError}</small> : null}
    </label> : null}
    <footer>
      {suggestion.can_accept ? <Button loading={busy} onClick={() => onDecision(suggestion, "accept")} size="small" type="button">Use proposed</Button> : null}
      {suggestion.can_reject ? <Button disabled={busy} onClick={() => onDecision(suggestion, "reject")} size="small" type="button" variant="outline">Keep current</Button> : null}
      {suggestion.can_edit ? editing
        ? <Button loading={busy} onClick={acceptEdited} size="small" type="button" variant="secondary">Save edited value</Button>
        : <Button disabled={busy} onClick={() => setEditing(true)} size="small" type="button" variant="ghost">Edit &amp; accept</Button>
        : null}
      {!suggestion.is_actionable ? <span className="cv-muted">Matched — no action needed</span> : null}
    </footer>
  </article>;
}

function FinalReview({
  acknowledged,
  draft,
  onAcknowledged,
}: {
  acknowledged: boolean;
  draft: CVReviewDraft;
  onAcknowledged: (value: boolean) => void;
}) {
  return <div className="cv-final-review">
    <div className="cv-final-hero"><span aria-hidden="true">✓</span><strong>Your reviewed data is ready</strong><p>Nothing is applied until you confirm below.</p></div>
    <CVSummaryStats value={draft as unknown as JsonValue} />
    <section className="cv-final-profile"><h3>Final reviewed profile</h3><CVStructuredValue value={draft as unknown as JsonValue} /></section>
    <label className="cv-acknowledgement"><input checked={acknowledged} onChange={(event) => onAcknowledged(event.target.checked)} type="checkbox" />I reviewed this information and want to add it to my profile</label>
  </div>;
}
