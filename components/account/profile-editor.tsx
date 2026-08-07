"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AuthClientError, updateAccountProfile } from "@/lib/auth/client";
import type { AuthenticatedUser, JobSeekerProfileDetail, ValidationErrors } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarEditor } from "@/components/account/avatar-editor";

const editableFields = ["headline", "summary", "phone", "location", "portfolio_url", "linkedin_url", "github_url"] as const;
type EditableField = typeof editableFields[number];
type ProfileForm = Record<EditableField, string>;
type FieldErrors = Partial<Record<EditableField, string>>;

function toForm(profile: JobSeekerProfileDetail): ProfileForm { return Object.fromEntries(editableFields.map((field) => [field, profile[field] ?? ""])) as ProfileForm; }
function cleaned(value: string) { return value.trim(); }
function firstMessage(errors?: ValidationErrors) { return Object.fromEntries(Object.entries(errors ?? {}).map(([field, messages]) => [field, messages[0]])); }
function emptyValue(value: string | null | undefined) { return value?.trim() ? value : "Not added yet."; }

function ProfileLink({ href }: { href: string | null }) {
  return href ? <a className="break-all font-semibold" href={href} rel="noreferrer" target="_blank">{href}</a> : <span className="text-text-muted">Not added yet.</span>;
}

export function ProfileEditor({ initialProfile, user }: { initialProfile: JobSeekerProfileDetail; user: AuthenticatedUser }) {
  const router = useRouter();
  const currentUser: AuthenticatedUser = { ...(initialProfile.user ?? {}), ...user };
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState<ProfileForm>(() => toForm(initialProfile));
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined);
  const dirty = useMemo(() => editableFields.some((field) => cleaned(form[field]) !== cleaned(profile[field] ?? "")), [form, profile]);

  useEffect(() => { function warn(event: BeforeUnloadEvent) { if (!dirty || mode !== "edit") return; event.preventDefault(); event.returnValue = ""; } window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, mode]);

  function edit() { setForm(toForm(profile)); setErrors({}); setFormError(null); setSuccess(null); setMode("edit"); }
  function cancel() { if (dirty && !window.confirm("Discard your unsaved profile changes?")) return; setForm(toForm(profile)); setErrors({}); setFormError(null); setMode("view"); }
  function update(field: EditableField, value: string) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (form.headline.length > 255) nextErrors.headline = "Headline must be 255 characters or fewer.";
    if (form.phone.length > 50) nextErrors.phone = "Phone number must be 50 characters or fewer.";
    for (const field of ["location", "portfolio_url", "linkedin_url", "github_url"] as const) if (form[field].length > 255) nextErrors[field] = "This value must be 255 characters or fewer.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); requestAnimationFrame(() => document.getElementById(`profile-${Object.keys(nextErrors)[0]}`)?.focus()); return; }
    const payload: Partial<Record<EditableField, string | null>> = {};
    editableFields.forEach((field) => { const next = cleaned(form[field]) || null; const current = cleaned(profile[field] ?? "") || null; if (next !== current) payload[field] = next; });
    if (!Object.keys(payload).length) { setMode("view"); return; }

    setPending(true); setFormError(null); setSuccess(null);
    try {
      const updated = await updateAccountProfile(payload);
      setProfile(updated); setForm(toForm(updated)); setMode("view"); setSuccess("Your profile changes have been saved."); router.refresh();
    } catch (reason) {
      const authError = reason instanceof AuthClientError ? reason : new AuthClientError(503, "Profile information is temporarily unavailable. Please try again shortly.");
      if (authError.status === 401) { router.replace("/login?returnTo=/account/profile"); router.refresh(); return; }
      const mapped = firstMessage(authError.errors) as FieldErrors;
      if (Object.keys(mapped).length) { setErrors(mapped); requestAnimationFrame(() => document.getElementById(`profile-${Object.keys(mapped)[0]}`)?.focus()); } else setFormError(authError.message);
    } finally { setPending(false); }
  }

  const fullUser: AuthenticatedUser = { ...(profile.user ?? {}), ...user };
  const effectiveAvatarUrl = avatarOverride === undefined ? currentUser.avatar_url : avatarOverride;
  if (mode === "view") return <div className="max-w-4xl"><header className="flex flex-wrap items-center justify-between gap-5"><div className="flex min-w-0 items-center gap-4"><AvatarEditor avatarUrl={effectiveAvatarUrl} name={fullUser.name} onAvatarChange={setAvatarOverride} /><div className="min-w-0"><p className="type-body-small font-semibold tracking-wide text-secondary">YOUR PROFILE</p><h1 className="type-heading-1 mt-1 text-text-primary">{fullUser.name}</h1><p className="type-body mt-1 text-text-secondary">{fullUser.email}</p>{profile.headline ? <p className="type-body-small mt-2 font-medium text-text-primary">{profile.headline}</p> : null}{profile.location ? <p className="type-body-small mt-1 text-text-muted">{profile.location}</p> : null}</div></div><Button onClick={edit} type="button">Edit profile</Button></header>{success ? <p className="radius-medium mt-5 border border-border-default bg-success-surface p-3 type-body-small text-text-primary" role="status">{success}</p> : null}<div className="mt-8 divide-y divide-border-subtle border-y border-border-subtle"><section className="py-7"><h2 className="type-heading-3 text-text-primary">Professional information</h2><div className="mt-5 grid gap-5"><div><p className="type-body-small text-text-muted">Professional headline</p><p className="type-body mt-1 text-text-primary">{emptyValue(profile.headline)}</p></div><div><p className="type-body-small text-text-muted">Summary</p><p className="whitespace-pre-wrap type-body mt-1 text-text-primary">{emptyValue(profile.summary)}</p></div></div></section><section className="py-7"><h2 className="type-heading-3 text-text-primary">Contact information</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="type-body-small text-text-muted">Phone</p><p className="type-body mt-1 text-text-primary">{emptyValue(profile.phone)}</p></div><div><p className="type-body-small text-text-muted">Location</p><p className="type-body mt-1 text-text-primary">{emptyValue(profile.location)}</p></div></div></section><section className="py-7"><h2 className="type-heading-3 text-text-primary">Professional links</h2><div className="mt-5 grid gap-5 sm:grid-cols-3"><div><p className="type-body-small text-text-muted">Portfolio</p><p className="type-body-small mt-1"><ProfileLink href={profile.portfolio_url} /></p></div><div><p className="type-body-small text-text-muted">LinkedIn</p><p className="type-body-small mt-1"><ProfileLink href={profile.linkedin_url} /></p></div><div><p className="type-body-small text-text-muted">GitHub</p><p className="type-body-small mt-1"><ProfileLink href={profile.github_url} /></p></div></div></section></div></div>;

  return <div className="max-w-4xl"><p className="type-body-small font-semibold tracking-wide text-secondary">EDIT PROFILE</p><h1 className="type-heading-1 mt-2 text-text-primary">Update your profile</h1><p className="type-body mt-3 text-text-secondary">Name and email are managed separately and cannot be changed here.</p><form className="ui-card ui-card--elevated mt-7 grid gap-5" noValidate onSubmit={save}>{formError ? <p className="radius-medium border border-border-danger bg-danger-surface p-4 type-body-small text-danger" role="alert">{formError}</p> : null}<Input description={`${form.headline.length}/255 characters`} error={errors.headline} id="profile-headline" label="Professional headline (optional)" maxLength={255} onChange={(event) => update("headline", event.target.value)} value={form.headline} /><Textarea error={errors.summary} id="profile-summary" label="Summary (optional)" onChange={(event) => update("summary", event.target.value)} rows={6} value={form.summary} /><div className="grid gap-5 sm:grid-cols-2"><Input error={errors.phone} id="profile-phone" label="Phone (optional)" maxLength={50} onChange={(event) => update("phone", event.target.value)} type="tel" value={form.phone} /><Input error={errors.location} id="profile-location" label="Location (optional)" maxLength={255} onChange={(event) => update("location", event.target.value)} value={form.location} /></div><div className="grid gap-5"><Input error={errors.portfolio_url} id="profile-portfolio_url" label="Portfolio URL (optional)" maxLength={255} onChange={(event) => update("portfolio_url", event.target.value)} type="url" value={form.portfolio_url} /><Input error={errors.linkedin_url} id="profile-linkedin_url" label="LinkedIn URL (optional)" maxLength={255} onChange={(event) => update("linkedin_url", event.target.value)} type="url" value={form.linkedin_url} /><Input error={errors.github_url} id="profile-github_url" label="GitHub URL (optional)" maxLength={255} onChange={(event) => update("github_url", event.target.value)} type="url" value={form.github_url} /></div><div className="flex flex-wrap gap-3"><Button loading={pending} type="submit">Save changes</Button><Button disabled={pending} onClick={cancel} type="button" variant="outline">Cancel</Button><Link className="ui-button ui-button--ghost" href="/account">Back to overview</Link></div></form></div>;
}
