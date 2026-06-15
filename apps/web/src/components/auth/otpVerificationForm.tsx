import { Button } from "@rcode/ui/ui/button";
import { Input } from "@rcode/ui/ui/input";
import { type FormEvent } from "react";
import { Field } from "./authFields";

interface OtpVerificationFormProps {
  email: string;
  isSubmitting: boolean;
  otp: string;
  onBack: () => void;
  onOtpChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function OtpVerificationForm({ email, isSubmitting, otp, onBack, onOtpChange, onSubmit }: OtpVerificationFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Field label={`Enter the code sent to ${email}`}>
        <Input
          className="h-10 text-center tracking-[0.5em]"
          value={otp}
          onChange={(event) => onOtpChange(event.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          required
        />
      </Field>
      <Button className="h-10 w-full" type="submit" disabled={isSubmitting === true}>
        {isSubmitting === true ? "Verifying..." : "Continue"}
      </Button>
      <button className="w-full text-sm text-muted-foreground hover:text-foreground" type="button" onClick={onBack}>
        Use a different email
      </button>
    </form>
  );
}
