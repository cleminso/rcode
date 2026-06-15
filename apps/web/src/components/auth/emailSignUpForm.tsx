import { Button } from "@rcode/ui/ui/button";
import { Input } from "@rcode/ui/ui/input";
import { type FormEvent } from "react";
import { Field, SignUpProfileFields } from "./authFields";

interface EmailSignUpFormProps {
  displayName: string;
  email: string;
  isSubmitting: boolean;
  name: string;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function EmailSignUpForm(props: EmailSignUpFormProps) {
  return (
    <form className="space-y-5" onSubmit={props.onSubmit}>
      <SignUpProfileFields
        displayName={props.displayName}
        name={props.name}
        onDisplayNameChange={props.onDisplayNameChange}
        onNameChange={props.onNameChange}
      />
      <Field label="Email">
        <Input
          type="email"
          value={props.email}
          onChange={(event) => props.onEmailChange(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      <Button className="h-10 w-full" type="submit" disabled={props.isSubmitting === true}>
        {props.isSubmitting === true ? "Sending..." : "Continue"}
      </Button>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Access your identity from any device</li>
        <li>No password to remember</li>
        <li>Verify with a code sent to your email</li>
      </ul>
    </form>
  );
}
