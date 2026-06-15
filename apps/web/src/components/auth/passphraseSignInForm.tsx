import { Button } from "@rcode/ui/ui/button";
import { Textarea } from "@rcode/ui/ui/textarea";
import { type FormEvent } from "react";
import { Field } from "./authFields";

interface PassphraseSignInFormProps {
  isSubmitting: boolean;
  restorePhrase: string;
  onRestorePhraseChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PassphraseSignInForm({ isSubmitting, restorePhrase, onRestorePhraseChange, onSubmit }: PassphraseSignInFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Field label="Recovery phrase">
        <Textarea
          className="min-h-36"
          value={restorePhrase}
          onChange={(event) => onRestorePhraseChange(event.target.value)}
          placeholder="Paste recovery phrase words"
          required
        />
      </Field>
      <Button className="h-10 w-full" type="submit" disabled={isSubmitting === true}>
        {isSubmitting === true ? "Restoring..." : "Continue"}
      </Button>
    </form>
  );
}
