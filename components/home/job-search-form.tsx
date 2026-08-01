"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobSearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const params = new URLSearchParams(); if (search.trim()) params.set("search", search.trim()); router.push(`/explore${params.size ? `?${params.toString()}` : ""}`); }
  return <form className={`grid gap-3 ${compact ? "" : "md:grid-cols-[1fr_auto] md:items-end"}`} onSubmit={submit} role="search"><Input label="Job title or keyword" name="search" onChange={(event) => setSearch(event.target.value)} placeholder="e.g. product designer" type="search" value={search} /><Button fullWidth={compact} type="submit">Search jobs</Button></form>;
}
