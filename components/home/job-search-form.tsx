"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobSearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState(""); const [location, setLocation] = useState(""); const [workMode, setWorkMode] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const params = new URLSearchParams(); if (search.trim()) params.set("search", search.trim()); if (location.trim()) params.set("location", location.trim()); if (workMode) params.set("work_mode", workMode); router.push(`/explore${params.size ? `?${params.toString()}` : ""}`); }
  return <form className={`grid gap-3 ${compact ? "" : "md:grid-cols-[1fr_1fr_minmax(9rem,.7fr)_auto] md:items-end"}`} onSubmit={submit} role="search"><Input label="Job title or keyword" name="search" onChange={(event) => setSearch(event.target.value)} placeholder="e.g. product designer" type="search" value={search} /><Input label="Location" name="location" onChange={(event) => setLocation(event.target.value)} placeholder="City or remote" type="text" value={location} /><label className="grid gap-2 type-body-small text-text-secondary"><span className="font-medium text-text-primary">Work style</span><select className="ui-select" name="work_mode" onChange={(event) => setWorkMode(event.target.value)} value={workMode}><option value="">Any style</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on_site">On-site</option></select></label><Button fullWidth={compact} type="submit">Search jobs</Button></form>;
}
