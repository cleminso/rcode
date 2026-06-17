import Button from "@rcode/ui/button";
import { type FocusEvent, type FormEvent, useState } from "react";
import { AuthField } from "./authFields";

type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;

interface PassphraseSignUpFormProps {
  copiedRecoveryPhrase: boolean;
  displayName: string;
  isSubmitting: boolean;
  recoveryPhrase: string | null;
  onDisplayNameChange: (value: string) => void;
  onSubmit: FormSubmitHandler;
}

export function PassphraseSignUpForm(props: PassphraseSignUpFormProps) {
  const [isTouched, setIsTouched] = useState(false);
  const displayNameIsEmpty = props.displayName.trim() === "";
  const showDisplayNameError = isTouched === true && displayNameIsEmpty === true;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setIsTouched(true);
    props.onSubmit(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-auth-tab-trigger='true']") !== null) {
      return;
    }

    setIsTouched(true);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <AuthField
        label="DISPLAY NAME"
        value={props.displayName}
        onChange={(event) => props.onDisplayNameChange(event.target.value)}
        onBlur={handleBlur}
        onInvalid={() => setIsTouched(true)}
        autoComplete="nickname"
        autoFocus
        error={showDisplayNameError === true ? "// Display name is required" : null}
        required
      />
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-xs font-medium uppercase ">RECOVERY PHRASE</p>
        <textarea
          className="min-h-28 resize-none border border-input bg-input/20 p-3 font-mono text-sm leading-5 text-muted-foreground outline-none transition-[filter] duration-200 read-only:cursor-default"
          readOnly
          rows={4}
          value={props.recoveryPhrase ?? "Loading recovery phrase..."}
          style={{ filter: props.copiedRecoveryPhrase === true ? "none" : "blur(5px)" }}
          tabIndex={props.copiedRecoveryPhrase === true ? 0 : -1}
          aria-label="Recovery phrase"
        />
        <span className="sr-only">
          {props.recoveryPhrase ?? "Loading recovery phrase..."}
        </span>
      </div>
      <Button className="h-[34px] w-full text-base uppercase" variant="primary" type="submit" disabled={props.isSubmitting === true || displayNameIsEmpty === true}>
        {props.copiedRecoveryPhrase === true ? "CONTINUE" : "SHOW & COPY PASSPHRASE"}
      </Button>
      <p className="whitespace-pre-line font-mono text-sm leading-5 text-muted-foreground">
        {"// Save this phrase to access your identity on another device\n// If lost, we're unable to recover your identity\n// Anyone with this phrase can access this identity\n// You can link an email in your settings"}
      </p>
    </form>
  );
}
