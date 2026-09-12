import { app } from "@rcode/schema";
import { buttonVariants } from "@rcode/ui/button";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useDb, useSession } from "jazz-tools/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { getAuthClient } from "../../lib/auth-client";
import { getErrorMessage } from "../../lib/errors";
import { emailAuthUnavailable, isEmailAuthEnabled, useRcodeJazzAuth } from "../../lib/jazzAuth";
import { toasts } from "../../lib/toasts";
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
  const jazzAuth = useRcodeJazzAuth();
  const sessionUserId = session?.user.account ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId, { confirmMissing: true });
  const profile = profileIdentity.profile;
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
  const recoveryPhrase = useMemo(() => {
    const secret = jazzAuth.getRecoverySecret();
    return secret === null ? null : RecoveryPhrase.fromSecret(secret);
  }, [jazzAuth, sessionUserId]);
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

  if (hasCompletedProfile === true && profileIdentity.isLoading === false) {
    return <Navigate replace to="/dashboard" />;
  }

  const updateSignUpField = (field: keyof EmailSignUpValues, value: string) => {
    setSignUpValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const upsertProfile = async (nextDisplayName: string, activeDb = db) => {
    if (sessionUserId === null) {
      throw new Error("A Jazz identity is required before creating a profile.");
    }

    const trimmedDisplayName = nextDisplayName.trim();

    if (trimmedDisplayName === "") {
      throw new Error("Display name is required.");
    }

    if (profile !== null) {
      await activeDb.update(app.profiles, profile.id, { displayName: trimmedDisplayName, origin: "user-created", setupPromptDismissed: true }).wait({ tier: "edge" });
      return;
    }

    await activeDb
      .insert(app.profiles, {
        session_user_id: sessionUserId,
        displayName: trimmedDisplayName,
        origin: "user-created",
        setupPromptDismissed: true,
      })
      .wait({ tier: "edge" });
  };

  const requestOtp = async (isResend: boolean) => {
    if (isEmailAuthEnabled === false) {
      toasts.auth.error(emailAuthUnavailable);
      return;
    }

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
          ? db.getLocalFirstIdentityProof({
              ttlSeconds: 60,
              audience: "betterauth-signup",
            })
          : null;

      if (intent === "sign-up" && proofToken === null) {
        throw new Error("Sign up requires an active Jazz local-first identity. Refresh and try again.");
      }

      const authClient = await getAuthClient();
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
      toasts.auth.codeSent(email);
    } catch (caughtError) {
      const nextMessage = getErrorMessage(caughtError);

      if (intent === "sign-in" && isMissingAccountError(nextMessage) === true) {
        toasts.auth.missingAccount();
        await navigate({ to: "/sign-up", search: { email } });
        return;
      }

      toasts.auth.error(nextMessage);
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
    if (isEmailAuthEnabled === false) {
      toasts.auth.error(emailAuthUnavailable);
      return;
    }

    setIsSubmitting(true);

    try {
      const proofToken =
        intent === "sign-up"
          ? db.getLocalFirstIdentityProof({
              ttlSeconds: 60,
              audience: "betterauth-signup",
            })
          : null;

      if (intent === "sign-up" && (proofToken === null || proofToken === undefined)) {
        throw new Error("Sign up requires an active Jazz local-first identity.");
      }

      const authClient = await getAuthClient();
      const activeDb = await jazzAuth.withProviderAccount(intent === "sign-up" ? "link" : "login", async () => {
        const result = await authClient.signIn.emailOtp({
          email,
          otp: nextOtp,
          name: intent === "sign-up" ? signUpValues.displayName : undefined,
          proofToken: proofToken ?? undefined,
        } as Parameters<typeof authClient.signIn.emailOtp>[0]);

        if (result.error !== null && result.error !== undefined) {
          throw new Error(result.error.message ?? "Verification failed.");
        }
      });

      if (intent === "sign-up") {
        await upsertProfile(signUpValues.displayName, activeDb);
      }

      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      toasts.auth.error(getErrorMessage(caughtError));
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
      toasts.auth.missingRecoveryPhrase();
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryPhrase);
      setCopiedRecoveryPhrase(true);
      toasts.auth.recoveryPhraseCopied();
    } catch (error) {
      toasts.auth.error(getErrorMessage(error, "Recovery phrase could not be copied."));
    }
  };

  const handlePassphraseSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (copiedRecoveryPhrase === false) {
      await copyRecoveryPhrase();
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertProfile(signUpValues.displayName);
      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      toasts.auth.error(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const restoredSecret = RecoveryPhrase.toSecret(restorePhrase);
      await jazzAuth.restoreLocalFirst(restoredSecret);
      await navigate({ to: "/dashboard" });
    } catch {
      toasts.auth.invalidRecoveryPhrase();
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToInput = () => {
    setOtpStep("input");
    setOtp("");
  };

  const footer =
    otpStep === "input" ? (
      intent === "sign-in" ? (
        <>
          Don't have an account?{" "}
          <Link
            to="/sign-up"
            className={buttonVariants({ variant: "ghost", size: "none", className: "h-auto rounded-none px-0 font-sans text-base font-medium underline underline-offset-2 hover:bg-transparent hover:text-foreground" })}
            data-auth-tab-trigger="true"
          >
            Sign up
          </Link>
        </>
      ) : (
        <>
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className={buttonVariants({ variant: "ghost", size: "none", className: "h-auto rounded-none px-0 font-sans text-base font-mediuem underline underline-offset-2 hover:bg-transparent hover:text-foreground" })}
            data-auth-tab-trigger="true"
          >
            Sign in
          </Link>
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
          isSubmitting={isSubmitting}
          restorePhrase={restorePhrase}
          onRestorePhraseChange={setRestorePhrase}
          onSubmit={handleRestore}
        />
      ) : null}
    </AuthShell>
  );
}
