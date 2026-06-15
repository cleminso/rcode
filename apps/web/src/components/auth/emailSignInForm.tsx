import { Button } from "@rcode/ui/ui/button";
import { Input } from "@rcode/ui/ui/input";
import { type FormEvent } from "react";
import { Field } from "./authFields";

interface EmailSignInFormProps {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function EmailSignInForm({ email, isSubmitting, onEmailChange, onSubmit }: EmailSignInFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      <Button className="h-10 w-full" type="submit" disabled={isSubmitting === true}>
        {isSubmitting === true ? "Sending..." : "Continue"}
      </Button>
    </form>
  );
}
