import { Input } from "@rcode/ui/input";
import { Textarea } from "@rcode/ui/textarea";
import { Field, FieldLabel } from "@rcode/ui/field";
import { type ComponentProps } from "react";

interface AuthFieldProps extends ComponentProps<typeof Input> {
  error?: string | null;
  label: string;
}

export function AuthField({ error = null, id, label, ...props }: AuthFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field data-invalid={error !== null}>
      <div className="flexrow-between-3">
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {error !== null ? <span className="font-mono text-xs uppercase text-destructive">REQUIRED</span> : null}
      </div>
      <Input id={inputId} aria-invalid={error !== null} {...props} />
    </Field>
  );
}

interface AuthTextareaFieldProps extends ComponentProps<typeof Textarea> {
  error?: string | null;
  label: string;
}

export function AuthTextareaField({ error = null, id, label, ...props }: AuthTextareaFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field data-invalid={error !== null}>
      <div className="flexrow-between-3">
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {error !== null ? <span className="font-mono text-xs uppercase text-destructive">REQUIRED</span> : null}
      </div>
      <Textarea id={inputId} aria-invalid={error !== null} {...props} />
    </Field>
  );
}
