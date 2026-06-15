import { app } from "@rcode/schema";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useAll, useDb, useLocalFirstAuth, useSession } from "jazz-tools/react";
import { type FormEvent, useMemo, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { type AuthMethod, AuthShell } from "./authShell";
import { EmailSignInForm } from "./emailSignInForm";
import { EmailSignUpForm } from "./emailSignUpForm";
import { OtpVerificationForm } from "./otpVerificationForm";
import { PassphraseSignInForm } from "./passphraseSignInForm";
import { PassphraseSignUpForm } from "./passphraseSignUpForm";

type AuthIntent = "sign-in" | "sign-up";
type OtpStep = "input" | "verify";

interface AuthScreenProps {
  intent: AuthIntent;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function isCompletedDisplayName(displayName: string | undefined) {
  return displayName !== undefined && displayName.trim() !== "";
}

export function AuthScreen({ intent }: AuthScreenProps) {
  const navigate = useNavigate();
  const db = useDb();
  const session = useSession();
  const localFirstAuth = useLocalFirstAuth();
  const { data: authSession } = authClient.useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const profileIsLoading = sessionUserId !== null && profileRows === undefined;
  const [method, setMethod] = useState<AuthMethod>("email");
  const [otpStep, setOtpStep] = useState<OtpStep>("input");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [copiedRecoveryPhrase, setCopiedRecoveryPhrase] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recoveryPhrase = useMemo(() => {
    if (localFirstAuth.secret === null || localFirstAuth.secret === undefined) return null;
    return RecoveryPhrase.fromSecret(localFirstAuth.secret);
  }, [localFirstAuth.secret]);
  const hasCompletedProfile = isCompletedDisplayName(profile?.displayName);

  if (hasCompletedProfile === true && profileIsLoading === false) {
    return <Navigate replace to="/dashboard" />;
  }

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
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

  const sendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    try {
      if (intent === "sign-up" && displayName.trim() === "") {
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

      setOtpStep("verify");
      setMessage(`We sent a code to ${email}.`);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        otp,
        name: intent === "sign-up" ? name : undefined,
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

        await upsertProfile(displayName);
      }

      // TODO: Warn before switching from a local-first identity to a different email identity.
      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRecoveryPhrase = async () => {
    if (recoveryPhrase === null) {
      setError("No recovery phrase is available yet.");
      return;
    }

    await navigator.clipboard.writeText(recoveryPhrase);
    setCopiedRecoveryPhrase(true);
    setMessage("Recovery phrase copied. Save it before continuing.");
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
      await upsertProfile(displayName);
      await navigate({ to: "/dashboard" });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
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
      setMessage("Recovery phrase restored. This browser now uses that Jazz identity.");
      setRestorePhrase("");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer =
    intent === "sign-in" ? (
      <Link className="text-muted-foreground hover:text-foreground" to="/sign-up">
        Don’t have an account? Sign up
      </Link>
    ) : (
      <Link className="text-muted-foreground hover:text-foreground" to="/sign-in">
        Already have an account? Sign in
      </Link>
    );

  return (
    <AuthShell
      description={
        intent === "sign-in"
          ? "Access your identity with email or recovery phrase."
          : "Create your profile with email or keep a local-first recovery phrase."
      }
      footer={footer}
      method={method}
      title={intent === "sign-in" ? "Sign in" : "Sign up"}
      onMethodChange={(nextMethod) => {
        setMethod(nextMethod);
        setOtpStep("input");
        clearFeedback();
      }}
    >
      {method === "email" && otpStep === "input" && intent === "sign-in" ? (
        <EmailSignInForm email={email} isSubmitting={isSubmitting} onEmailChange={setEmail} onSubmit={sendOtp} />
      ) : null}
      {method === "email" && otpStep === "input" && intent === "sign-up" ? (
        <EmailSignUpForm
          displayName={displayName}
          email={email}
          isSubmitting={isSubmitting}
          name={name}
          onDisplayNameChange={setDisplayName}
          onEmailChange={setEmail}
          onNameChange={setName}
          onSubmit={sendOtp}
        />
      ) : null}
      {method === "email" && otpStep === "verify" ? (
        <OtpVerificationForm
          email={email}
          isSubmitting={isSubmitting}
          otp={otp}
          onBack={() => setOtpStep("input")}
          onOtpChange={setOtp}
          onSubmit={verifyOtp}
        />
      ) : null}
      {method === "passphrase" && intent === "sign-up" ? (
        <PassphraseSignUpForm
          copiedRecoveryPhrase={copiedRecoveryPhrase}
          displayName={displayName}
          isSubmitting={isSubmitting}
          name={name}
          recoveryPhrase={recoveryPhrase}
          onDisplayNameChange={setDisplayName}
          onNameChange={setName}
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
      {message !== null ? <p className="mt-4 rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
      {error !== null ? <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
    </AuthShell>
  );
}
