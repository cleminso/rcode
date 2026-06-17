import Button from "@rcode/ui/button";
import { type FocusEvent, type FormEvent, useState } from "react";
import { AuthTextareaField } from "./authFields";

type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;

interface PassphraseSignInFormProps {
  isSubmitting: boolean;
  restorePhrase: string;
  onRestorePhraseChange: (value: string) => void;
  onSubmit: FormSubmitHandler;
}

export function PassphraseSignInForm({ isSubmitting, restorePhrase, onRestorePhraseChange, onSubmit }: PassphraseSignInFormProps) {
  const [isTouched, setIsTouched] = useState(false);
  const phraseIsEmpty = restorePhrase.trim() === "";
  const showPhraseError = isTouched === true && phraseIsEmpty === true;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setIsTouched(true);
    onSubmit(event);
  };

  const handleBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-auth-tab-trigger='true']") !== null) {
      return;
    }

    setIsTouched(true);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <AuthTextareaField
        className="min-h-28 font-mono text-sm"
        label="RECOVERY PHRASE"
        value={restorePhrase}
        onChange={(event) => onRestorePhraseChange(event.target.value)}
        onBlur={handleBlur}
        onInvalid={() => setIsTouched(true)}
        placeholder="Paste recovery phrase words"
        autoFocus
        error={showPhraseError === true ? "// Recovery phrase is required" : null}
        required
      />
      <Button className="h-[34px] w-full text-base uppercase" variant="primary" type="submit" disabled={isSubmitting === true || phraseIsEmpty === true}>
        {isSubmitting === true ? "RESTORING" : "CONTINUE"}
      </Button>
    </form>
  );
}
