import { Input } from "@rcode/ui/ui/input";
import { Label } from "@rcode/ui/ui/label";
import { type ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  label: string;
}

export function Field({ children, label }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

interface SignUpProfileFieldsProps {
  displayName: string;
  name: string;
  onDisplayNameChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

export function SignUpProfileFields({ displayName, name, onDisplayNameChange, onNameChange }: SignUpProfileFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name">
        <Input value={name} onChange={(event) => onNameChange(event.target.value)} autoComplete="name" />
      </Field>
      <Field label="Display name">
        <Input
          value={displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)}
          autoComplete="nickname"
          required
        />
      </Field>
    </div>
  );
}
