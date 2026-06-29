import { OtpInput } from "@rcode/ui/otpInput";
import Button from "@rcode/ui/button";

interface OtpVerificationFormProps {
  email: string;
  isResending: boolean;
  otp: string;
  resendSecondsLeft: number;
  onOtpChange: (value: string) => void;
  onResend: () => void;
}

export function OtpVerificationForm({ email, isResending, otp, resendSecondsLeft, onOtpChange, onResend }: OtpVerificationFormProps) {
  const canResend = resendSecondsLeft === 0 && isResending === false;

  return (
    <div className="mx-auto flex w-full max-w-150 rounded-xs flexcol-5 py-1">
      <div className="flexcol-1 text-base font-sans text-muted-foreground">
        <p>Enter the code sent to</p>
        <p className="font-medium text-foreground text-base font-sans">{email}</p>
      </div>
      <OtpInput value={otp} onChange={onOtpChange} aria-label="Verification code" autoFocus />
      <div className="flex justify-center gap-1 text-sm font-sans text-muted-foreground">
        <span>Didn't receive the code?</span>
        {canResend === true ? (
          <Button className="h-auto rounded-none px-0 text-sm underline underline-offset-2 hover:bg-transparent hover:text-foreground" size="none" variant="ghost" type="button" onClick={onResend}>
            Resend now
          </Button>
        ) : (
          <span className="underline underline-offset-2">Resend in {resendSecondsLeft}s</span>
        )}
      </div>
    </div>
  );
}
