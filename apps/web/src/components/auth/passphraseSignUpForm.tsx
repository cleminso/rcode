import { Button } from "@rcode/ui/ui/button";
import { type FormEvent } from "react";
import { Field, SignUpProfileFields } from "./authFields";

interface PassphraseSignUpFormProps {
  copiedRecoveryPhrase: boolean;
  displayName: string;
  isSubmitting: boolean;
  name: string;
  recoveryPhrase: string | null;
  onDisplayNameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PassphraseSignUpForm(props: PassphraseSignUpFormProps) {
  return (
    <form className="space-y-5" onSubmit={props.onSubmit}>
      <SignUpProfileFields
        displayName={props.displayName}
        name={props.name}
        onDisplayNameChange={props.onDisplayNameChange}
        onNameChange={props.onNameChange}
      />
      <Field label="Recovery phrase">
        <div className="min-h-32 rounded-md border bg-muted/30 p-4 text-sm leading-6">
          {props.recoveryPhrase ?? "Loading recovery phrase..."}
        </div>
      </Field>
      <Button className="h-10 w-full" type="submit" disabled={props.isSubmitting === true}>
        {props.copiedRecoveryPhrase === true ? "I saved it — continue" : "Copy recovery phrase"}
      </Button>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Use the app without email</li>
        <li>Save this phrase to access your identity on another device</li>
        <li>Anyone with this phrase can access this identity</li>
        <li>You can add email sign-in later</li>
      </ul>
    </form>
  );
}
