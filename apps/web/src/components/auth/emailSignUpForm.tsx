import Button from "@rcode/ui/button";
import { type FocusEvent, type FormEvent, useState } from "react";
import { AuthField } from "./authFields";

type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;

interface EmailSignUpFormValues {
  displayName: string;
  email: string;
}

interface EmailSignUpFormProps {
  autoFocusDisplayName: boolean;
  isSubmitting: boolean;
  values: EmailSignUpFormValues;
  onSubmit: FormSubmitHandler;
  onUpdateField: (field: keyof EmailSignUpFormValues, value: string) => void;
}

export function EmailSignUpForm({ autoFocusDisplayName, isSubmitting, values, onSubmit, onUpdateField }: EmailSignUpFormProps) {
  const [touchedFields, setTouchedFields] = useState<Record<keyof EmailSignUpFormValues, boolean>>({
    displayName: false,
    email: false,
  });
  const displayNameIsEmpty = values.displayName.trim() === "";
  const emailIsEmpty = values.email.trim() === "";
  const canSubmit = displayNameIsEmpty === false && emailIsEmpty === false;

  const markTouched = (field: keyof EmailSignUpFormValues) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const handleBlur = (field: keyof EmailSignUpFormValues) => (event: FocusEvent<HTMLInputElement>) => {
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-auth-tab-trigger='true']") !== null) {
      return;
    }

    markTouched(field);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setTouchedFields({ displayName: true, email: true });
    onSubmit(event);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-2 sm:grid-cols-2">
        <AuthField
          label="DISPLAY NAME"
          value={values.displayName}
          onChange={(event) => onUpdateField("displayName", event.target.value)}
          onBlur={handleBlur("displayName")}
          onInvalid={() => setTouchedFields((current) => ({ ...current, displayName: true }))}
          autoComplete="nickname"
          autoFocus={autoFocusDisplayName === true || values.displayName.trim() === ""}
          error={touchedFields.displayName === true && displayNameIsEmpty === true ? "Display name is required" : null}
          required
        />
        <AuthField
          label="EMAIL"
          type="email"
          value={values.email}
          onChange={(event) => onUpdateField("email", event.target.value)}
          onBlur={handleBlur("email")}
          onInvalid={() => setTouchedFields((current) => ({ ...current, email: true }))}
          autoComplete="email"
          error={touchedFields.email === true && emailIsEmpty === true ? "Email is required" : null}
          required
        />
      </div>
      <Button className="w-full text-base uppercase" variant="primary" size="sm" type="submit" disabled={isSubmitting === true || canSubmit === false}>
        {isSubmitting === true ? "SENDING" : "CONTINUE"}
      </Button>
      <p className="whitespace-pre-line font-mono font-normal text-sm leading-5 text-muted-foreground">
        {"// Access your identity from any device\n// Verify with a code sent to your email\n// No password to remember"}
      </p>
    </form>
  );
}
