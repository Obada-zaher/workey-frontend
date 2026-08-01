"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { get } from "@/lib/api/client";
import type { JobAutocompleteFilterDefinition, JobFilterDefinition, JobFilterOption, JobFilterPrimitive, JobFilterSchema } from "@/lib/api/types";
import { type AppliedJobFilterValue, type AppliedJobFilters, type JobRangeFilterValue, isJobFilterVisible } from "@/lib/jobs/query-builder";

interface JobFilterRendererProps {
  schema: JobFilterSchema;
  values: AppliedJobFilters;
  onChange: (key: string, value: AppliedJobFilterValue) => void;
  onAutocompleteLabel?: (key: string, label: string) => void;
}

function primitive(value: unknown): value is JobFilterPrimitive {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function rangeValue(value: AppliedJobFilterValue): JobRangeFilterValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value : { minimum: null, maximum: null };
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function remoteOptions(value: unknown, definition: JobAutocompleteFilterDefinition): JobFilterOption[] {
  const collection = Array.isArray(value)
    ? value
    : record(value) && Array.isArray(value.data)
      ? value.data
      : record(value) && record(value.data) && Array.isArray(value.data.data)
        ? value.data.data
        : [];

  return collection.flatMap((item) => {
    if (!record(item)) return [];
    const key = item[definition.options_source.value_field];
    const label = item[definition.options_source.label_field];
    return (typeof key === "string" || typeof key === "number") && typeof label === "string" && label.trim()
      ? [{ key, value: label }]
      : [];
  });
}

function SingleSelect({ definition, onChange, value }: { definition: Extract<JobFilterDefinition, { type: "single_select" }>; onChange: (value: JobFilterPrimitive | null) => void; value: AppliedJobFilterValue }) {
  const id = useId();
  return (
    <label className="explore-filter-control" htmlFor={id}>
      <span>{definition.label}</span>
      <select className="ui-select" id={id} onChange={(event) => onChange(event.target.value || null)} value={typeof value === "string" || typeof value === "number" ? String(value) : ""}>
        <option value="">Any {definition.label.toLowerCase()}</option>
        {definition.options.map((option) => <option key={String(option.key)} value={String(option.key)}>{option.value}</option>)}
      </select>
    </label>
  );
}

function BooleanFilter({ definition, onChange, value }: { definition: Extract<JobFilterDefinition, { type: "boolean" }>; onChange: (value: boolean) => void; value: AppliedJobFilterValue }) {
  const id = useId();
  return <label className="explore-filter-toggle" htmlFor={id}><input checked={value === true} id={id} onChange={(event) => onChange(event.target.checked)} type="checkbox" /><span>{definition.label}</span></label>;
}

function RangeFilter({ definition, onChange, value }: { definition: Extract<JobFilterDefinition, { type: "range" }>; onChange: (value: JobRangeFilterValue) => void; value: AppliedJobFilterValue }) {
  const current = rangeValue(value);
  const constraints = definition.constraints ?? {};
  const minimumConstraint = typeof constraints.minimum === "number" || typeof constraints.minimum === "string" ? constraints.minimum : undefined;
  const maximumConstraint = typeof constraints.maximum === "number" || typeof constraints.maximum === "string" ? constraints.maximum : undefined;
  const step = typeof constraints.step === "number" || typeof constraints.step === "string" ? constraints.step : "any";
  const update = (key: "minimum" | "maximum", next: string) => {
    const candidate = { ...current, [key]: next || null };
    const lower = Number(candidate.minimum);
    const upper = Number(candidate.maximum);
    if (candidate.minimum && candidate.maximum && Number.isFinite(lower) && Number.isFinite(upper) && lower > upper) return;
    onChange(candidate);
  };

  return (
    <fieldset className="explore-filter-range">
      <legend>{definition.label}</legend>
      <div>
        <Input label="Minimum" max={current.maximum ? String(current.maximum) : maximumConstraint} min={minimumConstraint} onChange={(event) => update("minimum", event.target.value)} step={step} type="number" value={current.minimum ? String(current.minimum) : ""} />
        <Input label="Maximum" max={maximumConstraint} min={current.minimum ? String(current.minimum) : minimumConstraint} onChange={(event) => update("maximum", event.target.value)} step={step} type="number" value={current.maximum ? String(current.maximum) : ""} />
      </div>
    </fieldset>
  );
}

function AutocompleteFilter({ definition, onChange, onSelected, value }: { definition: JobAutocompleteFilterDefinition; onChange: (value: string | number | null) => void; onSelected?: (label: string) => void; value: AppliedJobFilterValue }) {
  const id = useId();
  const [query, setQuery] = useState(() => primitive(value) ? String(value) : "");
  const [options, setOptions] = useState<JobFilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [retryNonce, setRetryNonce] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const minimum = definition.options_source.minimum_search_length;

  useEffect(() => {
    controller.current?.abort();
    if (query.trim().length < minimum) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const nextController = new AbortController();
      controller.current = nextController;
      setLoading(true);
      setError(false);
      try {
        const response = await get<unknown>(definition.options_source.endpoint, { query: { [definition.options_source.search_parameter]: query.trim() }, signal: nextController.signal });
        if (nextController.signal.aborted) return;
        const nextOptions = remoteOptions(response, definition);
        setOptions(nextOptions);
        const selected = primitive(value) ? nextOptions.find((option) => String(option.key) === String(value)) : undefined;
        if (selected) onSelected?.(selected.value);
        setHighlighted(-1);
      } catch {
        if (!nextController.signal.aborted) setError(true);
      } finally {
        if (!nextController.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.current?.abort();
    };
  }, [definition, minimum, onSelected, query, retryNonce, value]);

  const choose = (option: JobFilterOption) => {
    onChange(option.key);
    onSelected?.(option.value);
    setQuery(option.value);
    setOpen(false);
  };
  const retry = () => setRetryNonce((current) => current + 1);

  return (
    <div className="explore-filter-autocomplete">
      <label className="explore-filter-control" htmlFor={id}>
        <span>{definition.label}</span>
        <input
          aria-autocomplete="list"
          aria-controls={`${id}-options`}
          aria-expanded={open}
          className="ui-input"
          id={id}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); if (!event.target.value) onChange(null); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setHighlighted((index) => Math.min(index + 1, options.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted((index) => Math.max(index - 1, 0)); }
            if (event.key === "Enter" && highlighted >= 0 && options[highlighted]) { event.preventDefault(); choose(options[highlighted]); }
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={`Search ${definition.label.toLowerCase()}`}
          role="combobox"
          value={query || (primitive(value) ? String(value) : "")}
        />
      </label>
      {open ? <div className="explore-filter-options" id={`${id}-options`} role="listbox">
        {loading ? <p>Searching…</p> : error ? <p>Could not load options. <button onClick={retry} type="button">Retry</button></p> : options.length ? options.map((option, index) => <button aria-selected={highlighted === index} className={highlighted === index ? "is-highlighted" : undefined} key={String(option.key)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} role="option" type="button">{option.value}</button>) : query.trim().length >= minimum ? <p>No results found.</p> : <p>Type to search.</p>}
      </div> : null}
    </div>
  );
}

export function JobFilterRenderer({ onAutocompleteLabel, onChange, schema, values }: JobFilterRendererProps) {
  return (
    <div className="explore-filter-controls">
      {schema.filters.map((definition) => {
        if (!isJobFilterVisible(definition, schema.filters, values)) return null;
        const value = values[definition.key];
        if (definition.type === "single_select") return <SingleSelect definition={definition} key={definition.key} onChange={(next) => onChange(definition.key, next)} value={value} />;
        if (definition.type === "boolean") return <BooleanFilter definition={definition} key={definition.key} onChange={(next) => onChange(definition.key, next)} value={value} />;
        if (definition.type === "range") return <RangeFilter definition={definition} key={definition.key} onChange={(next) => onChange(definition.key, next)} value={value} />;
        if (definition.type === "autocomplete") return <AutocompleteFilter definition={definition} key={`${definition.key}-${String(value ?? "")}`} onChange={(next) => onChange(definition.key, next)} onSelected={(label) => onAutocompleteLabel?.(definition.key, label)} value={value} />;
        return null;
      })}
    </div>
  );
}
