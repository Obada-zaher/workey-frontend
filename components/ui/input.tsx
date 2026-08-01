import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; description?: string; error?: string; leading?: ReactNode; trailing?: ReactNode; }

export function Input({ className, description, error, id, label, leading, trailing, required, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const hasAdornment = leading || trailing;
  return <label className="grid gap-2 type-body-small text-text-secondary" htmlFor={inputId}><span className="font-medium text-text-primary">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>{hasAdornment ? <span className={`ui-input-wrapper${error ? " ui-input-wrapper--error" : ""}`}>{leading ? <span aria-hidden="true">{leading}</span> : null}<input aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`ui-input${className ? ` ${className}` : ""}`} id={inputId} required={required} {...props} />{trailing ? <span>{trailing}</span> : null}</span> : <input aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`ui-input${error ? " ui-input--error" : ""}${className ? ` ${className}` : ""}`} id={inputId} required={required} {...props} />}{description ? <span className="type-body-small text-text-muted" id={descriptionId}>{description}</span> : null}{error ? <span className="type-body-small text-danger" id={errorId} role="alert">{error}</span> : null}</label>;
}
