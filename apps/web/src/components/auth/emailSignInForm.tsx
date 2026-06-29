import Button from "@rcode/ui/button";
import { type FocusEvent, type FormEvent, useState } from "react";
import { AuthField } from "./authFields";

type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;

interface EmailSignInFormProps {
  email: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: FormSubmitHandler;
}

export function EmailSignInForm({ email, isSubmitting, onEmailChange, onSubmit }: EmailSignInFormProps) {
  const [isTouched, setIsTouched] = useState(false);
  const emailIsEmpty = email.trim() === "";
  const showEmailError = isTouched === true && emailIsEmpty === true;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setIsTouched(true);
    onSubmit(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-auth-tab-trigger='true']") !== null) {
      return;
    }

    setIsTouched(true);
  };

  return (
    <form className="flexcol-4" onSubmit={handleSubmit}>
      <AuthField
        label="EMAIL"
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        onBlur={handleBlur}
        onInvalid={() => setIsTouched(true)}
        autoComplete="email"
        autoFocus
        error={showEmailError === true ? "Email is required" : null}
        required
      />
      <Button className="w-full text-base uppercase" variant="primary" size="sm" type="submit" disabled={isSubmitting === true || emailIsEmpty === true}>
        {isSubmitting === true ? "SENDING" : "CONTINUE"}
      </Button>
    </form>
  );
}
