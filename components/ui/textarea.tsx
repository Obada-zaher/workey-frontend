import { useId, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; description?: string; error?: string; }

export function Textarea({ className, description, error, id, label, required, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId = description ? `${textareaId}-description` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  return <label className="grid gap-2 type-body-small text-text-secondary" htmlFor={textareaId}><span className="font-medium text-text-primary">{label}{required ? <span aria-hidden="true"> *</span> : null}</span><textarea aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`ui-textarea${error ? " ui-textarea--error" : ""}${className ? ` ${className}` : ""}`} id={textareaId} required={required} {...props} />{description ? <span className="type-body-small text-text-muted" id={descriptionId}>{description}</span> : null}{error ? <span className="type-body-small text-danger" id={errorId} role="alert">{error}</span> : null}</label>;
}
