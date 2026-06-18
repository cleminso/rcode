import { app } from "@rcode/schema";
import Button from "@rcode/ui/button";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useAll, useDb, useLocalFirstAuth, useSession } from "jazz-tools/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import { selectProfileRow } from "../../lib/profile";
import { type AuthMethod, AuthShell } from "./authShell";
import { EmailSignInForm } from "./emailSignInForm";
import { EmailSignUpForm } from "./emailSignUpForm";
import { OtpVerificationForm } from "./otpVerificationForm";
import { PassphraseSignInForm } from "./passphraseSignInForm";
import { PassphraseSignUpForm } from "./passphraseSignUpForm";

type AuthIntent = "sign-in" | "sign-up";
type OtpStep = "input" | "verify";

interface AuthScreenProps {
  initialEmail?: string;
  intent: AuthIntent;
}

interface EmailSignUpValues {
  displayName: string;
  email: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function isCompletedDisplayName(displayName: string | undefined) {
  return displayName !== undefined && displayName.trim() !== "";
}

function isMissingAccountError(message: string) {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes("no user found") === true || normalizedMessage.includes("user not found") === true;
}

function getAuthDescription(intent: AuthIntent, method: AuthMethod) {
  if (intent === "sign-in" && method === "email") {
    return "Enter your email below to authenticate to your account";
  }

  if (intent === "sign-in" && method === "passphrase") {
    return "Enter your passphrase below to authenticate to your account";
  }

  if (method === "email") {
    return "Enter your information below to create your account";
  }

  return "Enter your information below to create your account";
}

export function AuthScreen({ initialEmail = "", intent }: AuthScreenProps) {
  const navigate = useNavigate();
  const db = useDb();
  const session = useSession();
  const localFirstAuth = useLocalFirstAuth();
  const { data: authSession } = authClient.useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
    { tier: "edge" },
  );
  const profile = selectProfileRow(profileRows, sessionUserId);
  const profileIsLoading = sessionUserId !== null && profileRows === undefined;
  const [method, setMethod] = useState<AuthMethod>("email");
  const [otpStep, setOtpStep] = useState<OtpStep>("input");
  const [signInEmail, setSignInEmail] = useState(initialEmail);
  const [signUpValues, setSignUpValues] = useState<EmailSignUpValues>({ displayName: "", email: initialEmail });
  const [otp, setOtp] = useState("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [copiedRecoveryPhrase, setCopiedRecoveryPhrase] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingPassphraseProfile, setIsCheckingPassphraseProfile] = useState(false);
  const recoveryPhrase = useMemo(() => {
    if (localFirstAuth.secret === null || localFirstAuth.secret === undefined) return null;
    return RecoveryPhrase.fromSecret(localFirstAuth.secret);
  }, [localFirstAuth.secret]);
  const hasCompletedProfile = isCompletedDisplayName(profile?.displayName);
  const title = intent === "sign-in" ? "SIGN IN" : "SIGN UP";
  const email = intent === "sign-in" ? signInEmail : signUpValues.email;

  useEffect(() => {
    if (otpStep !== "verify" || resendSecondsLeft === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSecondsLeft((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpStep, resendSecondsLeft]);

  useEffect(() => {
    if (isCheckingPassphraseProfile === false || profileRows === undefined) {
      return;
    }

    if (profileRows.some((profileRow) => isCompletedDisplayName(profileRow.displayName)) === true) {
      setIsCheckingPassphraseProfile(false);
      void navigate({ to: "/dashboard" });
      return;
    }

    setIsCheckingPassphraseProfile(false);
    toast("No rcode profile found for this passphrase");
  }, [isCheckingPassphraseProfile, navigate, profileRows]);

  if (hasCompletedProfile === true && profileIsLoading === false && isCheckingPassphraseProfile === false) {
    return <Navigate replace to="/dashboard" />;
  }

  const clearFeedback = () => undefined;

  const updateSignUpField = (field: keyof EmailSignUpValues, value: string) => {
    setSignUpValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const upsertProfile = async (nextDisplayName: string) => {
    if (sessionUserId === null) {
      throw new Error("A Jazz identity is required before creating a profile.");
    }

    const trimmedDisplayName = nextDisplayName.trim();

    if (trimmedDisplayName === "") {
      throw new Error("Display name is required.");
    }

    if (profile !== null) {
      await db.update(app.profiles, profile.id, { displayName: trimmedDisplayName }).wait({ tier: "edge" });
      return;
    }

    await db
      .insert(app.profiles, {
        session_user_id: sessionUserId,
        displayName: trimmedDisplayName,
      })
      .wait({ tier: "edge" });
  };

  const requestOtp = async (isResend: boolean) => {
    clearFeedback();

    if (isResend === true) {
      setIsResending(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      if (intent === "sign-up" && signUpValues.displayName.trim() === "") {
        throw new Error("Display name is required.");
      }

      const proofToken =
        intent === "sign-up"
          ? await db.getLocalFirstIdentityProof({
              ttlSeconds: 60,
              audience: "betterauth-signup",
            })
          : null;

      if (intent === "sign-up" && (localFirstAuth.secret === null || proofToken === null)) {
        if (authSession?.session !== undefined) {
          await authClient.signOut();
          throw new Error("Previous email session cleared. Try signing up again.");
        }

        throw new Error("Sign up requires an active Jazz local-first identity. Refresh and try again.");
      }

      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        proofToken: proofToken ?? undefined,
      } as Parameters<typeof authClient.emailOtp.sendVerificationOtp>[0]);

      if (result.error !== null && result.error !== undefined) {
        throw new Error(result.error.message ?? "Could not send verification code.");
      }

      setOtp("");
      setOtpStep("verify");
      setResendSecondsLeft(30);
      toast(`Code sent to ${email}`);
    } catch (caughtError) {
      const nextMessage = getErrorMessage(caughtError);

      if (intent === "sign-in" && isMissingAccountError(nextMessage) === true) {
        toast("No account found for this email");
        await navigate({ to: "/sign-up", search: { email } });
        return;
      }

      toast(`${nextMessage}`);
    } finally {
      setIsSubmitting(false);
      setIsResending(false);
    }
  };

  const sendOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestOtp(false);
  };

  const verifyOtpCode = async (nextOtp: string) => {
    clearFeedback();
    setIsSubmitting(true);

    try {
      const proofToken =
        intent === "sign-up"
          ? await db.getLocalFirstIdentityProof({
              ttlSeconds: 60,
              audience: "betterauth-signup",
            })
          : null;

      if (intent === "sign-up" && (proofToken === null || proofToken === undefined)) {
        if (authSession?.session !== undefined) {
          await authClient.signOut();
          throw new Error("Previous email session cleared. Try signing up again.");
        }

        throw new Error("Sign up requires an active Jazz local-first identity.");
      }

      const result = await authClient.signIn.emailOtp({
        email,
        otp: nextOtp,
        name: intent === "sign-up" ? signUpValues.displayName : undefined,
        proofToken: proofToken ?? undefined,
      } as Parameters<typeof authClient.signIn.emailOtp>[0]);

      if (result.error !== null && result.error !== undefined) {
        throw new Error(result.error.message ?? "Verification failed.");
      }

      if (intent === "sign-up") {
        const signedInUserId = result.data?.user?.id;

        if (sessionUserId !== null && signedInUserId !== sessionUserId) {
          await authClient.signOut();
          throw new Error("This email is already linked to another identity. Sign in instead.");
        }

        await upsertProfile(signUpValues.displayName);
      }

      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      toast(`${getErrorMessage(caughtError)}`);
      setOtp("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOtp = (nextOtp: string) => {
    setOtp(nextOtp);

    if (nextOtp.length === 6 && isSubmitting === false) {
      void verifyOtpCode(nextOtp);
    }
  };

  const copyRecoveryPhrase = async () => {
    if (recoveryPhrase === null) {
      toast("No recovery phrase is available yet");
      return;
    }

    await navigator.clipboard.writeText(recoveryPhrase);
    setCopiedRecoveryPhrase(true);
    toast("Recovery phrase copied. Save it before continuing.");
  };

  const handlePassphraseSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (copiedRecoveryPhrase === false) {
      await copyRecoveryPhrase();
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertProfile(signUpValues.displayName);
      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      toast(`${getErrorMessage(caughtError)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    try {
      const restoredSecret = RecoveryPhrase.toSecret(restorePhrase);
      await localFirstAuth.login(restoredSecret);
      setIsCheckingPassphraseProfile(true);
    } catch {
      toast("Invalid recovery phrase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToInput = () => {
    setOtpStep("input");
    setOtp("");
    clearFeedback();
  };

  const footer =
    otpStep === "input" ? (
      intent === "sign-in" ? (
        <>
          Don't have an account?{" "}
          <Button
            className="h-auto rounded-none px-0 font-sans text-base font-normal underline underline-offset-2 hover:bg-transparent hover:text-foreground"
            data-auth-tab-trigger="true"
            size="none"
            type="button"
            variant="ghost"
            onClick={() => void navigate({ to: "/sign-up" })}
          >
            Sign up
          </Button>
        </>
      ) : (
        <>
          Already have an account?{" "}
          <Button
            className="h-auto rounded-none px-0 font-sans text-base font-normal underline underline-offset-2 hover:bg-transparent hover:text-foreground"
            data-auth-tab-trigger="true"
            size="none"
            type="button"
            variant="ghost"
            onClick={() => void navigate({ to: "/sign-in" })}
          >
            Sign in
          </Button>
        </>
      )
    ) : undefined;

  return (
    <AuthShell
      activeBreadcrumb={otpStep === "verify" ? "CHECK YOUR EMAIL" : undefined}
      description={otpStep === "input" ? getAuthDescription(intent, method) : undefined}
      footer={footer}
      method={otpStep === "input" ? method : undefined}
      title={title}
      onBreadcrumbBack={returnToInput}
      onMethodChange={(nextMethod) => {
        setMethod(nextMethod);
        setOtpStep("input");
        clearFeedback();
      }}
    >
      {method === "email" && otpStep === "input" && intent === "sign-in" ? (
        <EmailSignInForm email={signInEmail} isSubmitting={isSubmitting} onEmailChange={setSignInEmail} onSubmit={sendOtp} />
      ) : null}
      {method === "email" && otpStep === "input" && intent === "sign-up" ? (
        <EmailSignUpForm
          autoFocusDisplayName={initialEmail.trim() !== ""}
          isSubmitting={isSubmitting}
          values={signUpValues}
          onSubmit={sendOtp}
          onUpdateField={updateSignUpField}
        />
      ) : null}
      {method === "email" && otpStep === "verify" ? (
        <OtpVerificationForm
          email={email}
          isResending={isResending}
          otp={otp}
          resendSecondsLeft={resendSecondsLeft}
          onOtpChange={updateOtp}
          onResend={() => void requestOtp(true)}
        />
      ) : null}
      {method === "passphrase" && intent === "sign-up" ? (
        <PassphraseSignUpForm
          copiedRecoveryPhrase={copiedRecoveryPhrase}
          displayName={signUpValues.displayName}
          isSubmitting={isSubmitting}
          recoveryPhrase={recoveryPhrase}
          onDisplayNameChange={(value) => updateSignUpField("displayName", value)}
          onSubmit={handlePassphraseSignUp}
        />
      ) : null}
      {method === "passphrase" && intent === "sign-in" ? (
        <PassphraseSignInForm
          isSubmitting={isSubmitting || isCheckingPassphraseProfile}
          restorePhrase={restorePhrase}
          onRestorePhraseChange={setRestorePhrase}
          onSubmit={handleRestore}
        />
      ) : null}
    </AuthShell>
  );
}
