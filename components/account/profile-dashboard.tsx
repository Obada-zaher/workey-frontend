"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AvatarEditor } from "@/components/account/avatar-editor";
import { CVControlCenter } from "@/components/account/cv/cv-control-center";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { updateAccountProfile } from "@/lib/auth/client";
import type {
  AuthenticatedUser,
  JobSeekerProfileDetail,
  ProfileEducation,
  ProfileExperience,
  ProfileSkill,
  ProfessionalLink,
} from "@/lib/auth/types";

type Editor = "basic" | "summary" | "links" | "experience" | "education" | "skills" | null;
type Draft = Record<string, string | boolean>;
const empty = "Not added yet";

function formatMonth(value: string | null) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value))
    : null;
}

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function value(input: FormData, key: string) {
  const item = input.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function arrayData<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)) return payload.data as T[];
  return [];
}

function derivedLinks(profile: JobSeekerProfileDetail): ProfessionalLink[] {
  if (profile.professional_links) return profile.professional_links;
  const links: Array<[string, string, string | null | undefined]> = [
    ["linkedin", "LinkedIn", profile.linkedin_url],
    ["github", "GitHub", profile.github_url],
    ["portfolio", "Portfolio", profile.portfolio_url],
  ];
  return links.flatMap(([key, label, url]) => typeof url === "string" && url
    ? [{ type: { key, label }, url }]
    : []);
}

async function api(path: string, options?: RequestInit) {
  const response = await fetch(`/api/account/profile/resources/${path}`, {
    cache: "no-store",
    headers: options?.body instanceof FormData
      ? { Accept: "application/json" }
      : { Accept: "application/json", "Content-Type": "application/json" },
    ...options,
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : "Profile action could not be completed.");
  }
  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

export function ProfileDashboard({
  initialProfile,
  user,
}: {
  initialProfile: JobSeekerProfileDetail;
  user: AuthenticatedUser;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [editor, setEditor] = useState<Editor>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [skillOptions, setSkillOptions] = useState<ProfileSkill[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);

  const fullUser = { ...(profile.user ?? {}), ...user };
  const avatarUrl = avatar === undefined ? profile.identity?.avatar?.url ?? fullUser.avatar_url : avatar;
  const completeness = profile.profile_completeness;
  const progress = Math.min(100, Math.max(0, completeness?.percentage ?? 0));
  const experiences = profile.experiences ?? [];
  const education = profile.education ?? [];
  const skills = profile.skills ?? [];
  const links = derivedLinks(profile);
  const hasAvailability = Boolean(profile.career_summary?.availability || profile.availability_status || profile.available_from);

  async function refresh() {
    const response = await fetch("/api/account/profile", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok || !payload || typeof payload !== "object" || !("data" in payload)) throw new Error("Profile could not be refreshed.");
    setProfile(payload.data as JobSeekerProfileDetail);
  }

  function resetEditor() {
    setEditor(null);
    setEditingId(null);
    setDraft({});
    setError(null);
  }

  function close() {
    if (!busy) resetEditor();
  }

  async function open(kind: Exclude<Editor, null>, item?: ProfileExperience | ProfileEducation) {
    setError(null);
    setEditingId(item?.id ?? null);
    if (kind === "basic") {
      setDraft({ name: fullUser.name, headline: profile.headline ?? "", phone: profile.phone ?? "", location: profile.location ?? "" });
    } else if (kind === "summary") {
      setDraft({ summary: profile.summary ?? "" });
    } else if (kind === "links") {
      setDraft({ portfolio_url: profile.portfolio_url ?? "", linkedin_url: profile.linkedin_url ?? "", github_url: profile.github_url ?? "" });
    } else if (kind === "experience") {
      const record = item as ProfileExperience | undefined;
      setDraft({ title: record?.title ?? "", company_name: record?.company_name ?? "", location: record?.location ?? "", start_date: record?.start_date ?? "", end_date: record?.end_date ?? "", is_current: record?.is_current ?? false, description: record?.description ?? "" });
    } else if (kind === "education") {
      const record = item as ProfileEducation | undefined;
      setDraft({ institution: record?.institution ?? "", degree: record?.degree ?? "", field_of_study: record?.field_of_study ?? "", start_date: record?.start_date ?? "", end_date: record?.end_date ?? "", description: record?.description ?? "" });
    } else {
      try {
        setSkillOptions(arrayData<ProfileSkill>(await api("skill-options")));
      } catch {
        setSkillOptions([]);
      }
    }
    setEditor(kind);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const payload: Record<string, string | null> = {};
      if (editor === "basic") {
        payload.headline = value(form, "headline") || null;
        payload.phone = value(form, "phone") || null;
        payload.location = value(form, "location") || null;
      } else if (editor === "summary") {
        payload.summary = value(form, "summary") || null;
      } else {
        payload.portfolio_url = value(form, "portfolio_url") || null;
        payload.linkedin_url = value(form, "linkedin_url") || null;
        payload.github_url = value(form, "github_url") || null;
      }
      setProfile(await updateAccountProfile(payload));
      setNotice("Profile updated successfully.");
      resetEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor !== "experience" && editor !== "education") return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const startDate = value(form, "start_date");
      const endDate = value(form, "end_date");
      if (startDate && endDate && endDate < startDate) throw new Error("End date must be on or after the start date.");
      const body = editor === "experience"
        ? {
            title: value(form, "title"),
            company_name: value(form, "company_name"),
            location: value(form, "location") || null,
            start_date: startDate || null,
            end_date: form.get("is_current") ? null : endDate || null,
            is_current: Boolean(form.get("is_current")),
            description: value(form, "description") || null,
          }
        : {
            institution: value(form, "institution"),
            degree: value(form, "degree") || null,
            field_of_study: value(form, "field_of_study") || null,
            start_date: startDate || null,
            end_date: endDate || null,
            description: value(form, "description") || null,
          };
      await api(`${editor === "experience" ? "experiences" : "education"}${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      await refresh();
      setNotice(editingId ? "Entry updated." : "Entry added.");
      resetEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Entry could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(kind: "experiences" | "education" | "skills", id: number, itemLabel: string) {
    if (!window.confirm(`Remove ${itemLabel}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${kind}/${id}`, { method: "DELETE" });
      await refresh();
      setNotice("Item removed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Item could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  async function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Number(value(form, "skill_id"));
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await api("skills", { method: "POST", body: JSON.stringify({ skill_id: id }) });
      await refresh();
      setNotice("Skill added.");
      resetEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Skill could not be added.");
    } finally {
      setBusy(false);
    }
  }

  function dispatchTarget(target: { type: string; value: string }) {
    const map: Record<string, string> = { basic_information: "profile-basic", professional_summary: "profile-summary", professional_links: "profile-links", experiences: "profile-experience", education: "profile-education", skills: "profile-skills" };
    const id = target.type === "cv" || target.value === "cv" ? "profile-cv" : map[target.value] ?? "profile-basic";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return <div className="profile-dashboard">
    <header className="profile-dashboard__heading"><div><p>JOB SEEKER PROFILE</p><h1>My Profile</h1><span>Keep your professional information current and application-ready.</span></div></header>
    {notice ? <p className="profile-dashboard__notice" role="status">{notice}</p> : null}
    {error && !editor ? <p className="profile-dashboard__error" role="alert">{error}</p> : null}
    <CVControlCenter onNotice={setNotice} onProfileChange={setProfile} profile={profile} />
    <div className="profile-dashboard__layout">
      <aside className="profile-dashboard__sidebar">
        <section className="profile-identity-card"><AvatarEditor avatarUrl={avatarUrl} name={fullUser.name} onAvatarChange={setAvatar} /><h2>{fullUser.name}</h2><p>{profile.headline || "Add a professional headline"}</p><span>{profile.location || profile.city?.name || "Add your location"}</span><small>{fullUser.email}</small></section>
        {completeness ? <section className="profile-side-card"><div className="profile-side-card__title"><h2>Profile completeness</h2><strong>{progress}%</strong></div><div aria-label={`Profile ${progress}% complete`} className="profile-completeness"><span style={{ inlineSize: `${progress}%` }} /></div>{completeness.next_item ? <button onClick={() => dispatchTarget(completeness.next_item!.target)} type="button">Next: {completeness.next_item.label}</button> : <p>Your profile is complete.</p>}</section> : null}
        {profile.attention_items?.length ? <section className="profile-side-card profile-side-card--attention"><h2>Needs attention</h2>{profile.attention_items.slice(0, 4).map((item) => <div key={item.attention_key}><strong>{item.title}</strong><p>{item.description}</p></div>)}</section> : null}
      </aside>
      <main className="profile-dashboard__content">
        <ProfileSection action={() => void open("basic")} id="profile-basic" title="Basic information"><InfoGrid items={[["Name", fullUser.name], ["Phone", profile.phone], ["Headline", profile.headline], ["Location", profile.location || profile.city?.name]]} /></ProfileSection>
        {hasAvailability ? <ProfileSection id="profile-availability" title="Availability"><p>{profile.career_summary?.availability?.display_label || profile.availability_status?.replaceAll("_", " ") || empty}</p>{profile.available_from ? <small>Available from {profile.available_from}</small> : null}</ProfileSection> : null}
        <ProfileSection action={() => void open("summary")} id="profile-summary" title="Professional summary"><p className="profile-dashboard__prose">{profile.summary || empty}</p></ProfileSection>
        <ProfileSection action={() => void open("experience")} actionLabel="Add experience" id="profile-experience" title="Experience"><Timeline items={experiences.map((item) => ({ id: item.id, title: item.title, subtitle: item.company_name, meta: [formatMonth(item.start_date), item.is_current ? "Present" : formatMonth(item.end_date)].filter(Boolean).join(" – "), description: item.description, edit: () => void open("experience", item), remove: () => void remove("experiences", item.id, item.title) }))} /></ProfileSection>
        <ProfileSection action={() => void open("education")} actionLabel="Add education" id="profile-education" title="Education"><Timeline items={education.map((item) => ({ id: item.id, title: item.degree || item.field_of_study || "Education", subtitle: item.institution, meta: [formatMonth(item.start_date), formatMonth(item.end_date)].filter(Boolean).join(" – "), description: item.description, edit: () => void open("education", item), remove: () => void remove("education", item.id, item.institution) }))} /></ProfileSection>
        <ProfileSection action={() => void open("links")} id="profile-links" title="Professional links"><div className="profile-links">{links.length ? links.map((link) => <a href={safeUrl(link.url) ?? "#"} key={link.type.key} rel="noreferrer" target="_blank">{link.type.label}<span>↗</span></a>) : <p>{empty}</p>}</div></ProfileSection>
        <ProfileSection action={() => void open("skills")} actionLabel="Add skill" id="profile-skills" title="Skills"><div className="profile-skills">{skills.length ? skills.map((skill) => <span key={skill.id}>{skill.name}<button aria-label={`Remove ${skill.name}`} onClick={() => void remove("skills", skill.id, skill.name)} type="button">×</button></span>) : <p>{empty}</p>}</div></ProfileSection>
      </main>
    </div>
    {editor ? <EditorModal busy={busy} draft={draft} editor={editor} error={error} onClose={close} onCollectionSave={saveCollection} onProfileSave={saveProfile} onSkillSave={addSkill} skillOptions={skillOptions} /> : null}
  </div>;
}

function ProfileSection({ action, actionLabel = "Edit", children, id, title }: { action?: () => void; actionLabel?: string; children: ReactNode; id: string; title: string }) {
  return <section className="profile-section" id={id}><header><h2>{title}</h2>{action ? <Button onClick={action} size="small" type="button" variant="ghost">{actionLabel}</Button> : null}</header>{children}</section>;
}

function InfoGrid({ items }: { items: Array<[string, string | null | undefined]> }) {
  return <dl className="profile-info-grid">{items.map(([itemLabel, content]) => <div key={itemLabel}><dt>{itemLabel}</dt><dd>{content || empty}</dd></div>)}</dl>;
}

function Timeline({ items }: { items: Array<{ id: number; title: string; subtitle: string; meta: string; description: string | null; edit: () => void; remove: () => void }> }) {
  return items.length ? <div className="profile-timeline">{items.map((item) => <article key={item.id}><div><h3>{item.title}</h3><p>{item.subtitle}</p><small>{item.meta}</small>{item.description ? <p className="profile-dashboard__prose">{item.description}</p> : null}</div><div><button onClick={item.edit} type="button">Edit</button><button onClick={item.remove} type="button">Delete</button></div></article>)}</div> : <p className="profile-empty">Nothing added yet.</p>;
}

function EditorModal({
  busy,
  draft,
  editor,
  error,
  onClose,
  onCollectionSave,
  onProfileSave,
  onSkillSave,
  skillOptions,
}: {
  busy: boolean;
  draft: Draft;
  editor: Exclude<Editor, null>;
  error: string | null;
  onClose: () => void;
  onCollectionSave: (event: FormEvent<HTMLFormElement>) => void;
  onProfileSave: (event: FormEvent<HTMLFormElement>) => void;
  onSkillSave: (event: FormEvent<HTMLFormElement>) => void;
  skillOptions: ProfileSkill[];
}) {
  const collection = editor === "experience" || editor === "education";
  const submit = editor === "skills" ? onSkillSave : collection ? onCollectionSave : onProfileSave;
  return <Modal className="profile-dialog" labelledBy="profile-dialog-title" onClose={onClose}>
    <header><div><h2 id="profile-dialog-title">{editor === "experience" ? "Experience" : editor === "education" ? "Education" : editor === "skills" ? "Add skill" : `Edit ${editor}`}</h2><p>Update this section using your real profile information.</p></div><button aria-label="Close dialog" disabled={busy} onClick={onClose} type="button">×</button></header>
    <form onSubmit={submit}>
      {error ? <p className="profile-dashboard__error" role="alert">{error}</p> : null}
      {editor === "basic" ? <><Input defaultValue={String(draft.name ?? "")} disabled id="profile-name" label="Name (managed by your account)" name="name" /><Input defaultValue={String(draft.headline ?? "")} id="profile-headline" label="Professional headline" maxLength={255} name="headline" /><div className="profile-dialog__grid"><Input defaultValue={String(draft.phone ?? "")} id="profile-phone" label="Phone" maxLength={50} name="phone" type="tel" /><Input defaultValue={String(draft.location ?? "")} id="profile-location" label="Location" maxLength={255} name="location" /></div></> : null}
      {editor === "summary" ? <Textarea defaultValue={String(draft.summary ?? "")} id="profile-summary-input" label="Professional summary" name="summary" rows={7} /> : null}
      {editor === "links" ? <><Input defaultValue={String(draft.linkedin_url ?? "")} id="profile-linkedin" label="LinkedIn URL" maxLength={255} name="linkedin_url" type="url" /><Input defaultValue={String(draft.github_url ?? "")} id="profile-github" label="GitHub URL" maxLength={255} name="github_url" type="url" /><Input defaultValue={String(draft.portfolio_url ?? "")} id="profile-portfolio" label="Portfolio URL" maxLength={255} name="portfolio_url" type="url" /></> : null}
      {editor === "experience" ? <><Input defaultValue={String(draft.title ?? "")} id="experience-title" label="Job title" maxLength={255} name="title" required /><Input defaultValue={String(draft.company_name ?? "")} id="experience-company" label="Company" maxLength={255} name="company_name" required /><Input defaultValue={String(draft.location ?? "")} id="experience-location" label="Location" maxLength={255} name="location" /><div className="profile-dialog__grid"><Input defaultValue={String(draft.start_date ?? "")} id="experience-start" label="Start date" name="start_date" type="date" /><Input defaultValue={String(draft.end_date ?? "")} id="experience-end" label="End date" name="end_date" type="date" /></div><label className="profile-dialog__check"><input defaultChecked={Boolean(draft.is_current)} name="is_current" type="checkbox" /> I currently work here</label><Textarea defaultValue={String(draft.description ?? "")} id="experience-description" label="Description" name="description" rows={4} /></> : null}
      {editor === "education" ? <><Input defaultValue={String(draft.institution ?? "")} id="education-institution" label="Institution" maxLength={255} name="institution" required /><div className="profile-dialog__grid"><Input defaultValue={String(draft.degree ?? "")} id="education-degree" label="Degree" maxLength={255} name="degree" /><Input defaultValue={String(draft.field_of_study ?? "")} id="education-field" label="Field of study" maxLength={255} name="field_of_study" /></div><div className="profile-dialog__grid"><Input defaultValue={String(draft.start_date ?? "")} id="education-start" label="Start date" name="start_date" type="date" /><Input defaultValue={String(draft.end_date ?? "")} id="education-end" label="End date" name="end_date" type="date" /></div><Textarea defaultValue={String(draft.description ?? "")} id="education-description" label="Description" name="description" rows={4} /></> : null}
      {editor === "skills" ? <label className="profile-dialog__field"><span>Skill</span><select className="ui-select" name="skill_id" required><option value="">Choose a skill</option>{skillOptions.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label> : null}
      <footer><Button disabled={busy} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button loading={busy} type="submit">Save changes</Button></footer>
    </form>
  </Modal>;
}
