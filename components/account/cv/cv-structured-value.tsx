import type { JsonValue } from "@/lib/account/cv-types";

function label(key: string) { return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function CVStructuredValue({ value }: { value: JsonValue | undefined }) {
  if (value === null || value === undefined || value === "") return <span className="cv-muted">Not provided</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "string" || typeof value === "number") return <span className="cv-value-text">{String(value)}</span>;
  if (Array.isArray(value)) return <div className="cv-structured-list">{value.length ? value.map((item, index) => <div className="cv-structured-item" key={index}><CVStructuredValue value={item} /></div>) : <span className="cv-muted">None</span>}</div>;
  return <dl className="cv-structured-object">{Object.entries(value).map(([key, item]) => <div key={key}><dt>{label(key)}</dt><dd><CVStructuredValue value={item} /></dd></div>)}</dl>;
}

export function CVSummaryStats({ value }: { value: JsonValue | undefined }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, JsonValue>;
  const profile = record.profile && typeof record.profile === "object" && !Array.isArray(record.profile) ? Object.values(record.profile).filter((item) => item !== null && item !== "").length : 0;
  const count = (key: string) => Array.isArray(record[key]) ? record[key].length : 0;
  return <div className="cv-summary-stats">{[["Profile fields", profile], ["Experiences", count("experience") || count("experiences")], ["Education", count("education")], ["Skills", count("skills")]].map(([name, total]) => <div key={String(name)}><strong>{total}</strong><span>{name}</span></div>)}</div>;
}
