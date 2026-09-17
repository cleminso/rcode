import { app } from "@rcode/schema";
import { buttonVariants } from "@rcode/ui/button";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useDb, useSession } from "jazz-tools/react";
import { type FormEvent, useMemo, useState } from "react";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { getErrorMessage } from "../../lib/errors";
import { useRcodeJazzAuth } from "../../lib/jazzAuth";
import { toasts } from "../../lib/toasts";
import { AuthShell } from "./authShell";
import { PassphraseSignInForm } from "./passphraseSignInForm";
import { PassphraseSignUpForm } from "./passphraseSignUpForm";

type AuthIntent = "sign-in" | "sign-up";

interface AuthScreenProps {
  intent: AuthIntent;
}

function isCompletedDisplayName(displayName: string | undefined) {
  return displayName !== undefined && displayName.trim() !== "";
}

export function AuthScreen({ intent }: AuthScreenProps) {
  const navigate = useNavigate();
  const db = useDb();
  const session = useSession();
  const jazzAuth = useRcodeJazzAuth();
  const sessionUserId = session?.user.account ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId, { confirmMissing: true });
  const profile = profileIdentity.profile;
  const [displayName, setDisplayName] = useState("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [copiedRecoveryPhrase, setCopiedRecoveryPhrase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recoveryPhrase = useMemo(() => {
    const secret = jazzAuth.getRecoverySecret();
    return secret === null ? null : RecoveryPhrase.fromSecret(secret);
  }, [jazzAuth, sessionUserId]);
  const hasCompletedProfile = isCompletedDisplayName(profile?.displayName);
  const title = intent === "sign-in" ? "SIGN IN" : "SIGN UP";
  const description = intent === "sign-in" ? "Enter your passphrase below to authenticate to your account" : "Enter your information below to create your account";

  if (hasCompletedProfile === true && profileIdentity.isLoading === false) {
    return <Navigate replace to="/dashboard" />;
  }

  const upsertProfile = async (nextDisplayName: string) => {
    if (sessionUserId === null) {
      throw new Error("A Jazz identity is required before creating a profile.");
    }

    const trimmedDisplayName = nextDisplayName.trim();

    if (trimmedDisplayName === "") {
      throw new Error("Display name is required.");
    }

    if (profile !== null) {
      await db.update(app.profiles, profile.id, { displayName: trimmedDisplayName, origin: "user-created", setupPromptDismissed: true }).wait({ tier: "edge" });
      return;
    }

    await db
      .insert(app.profiles, {
        session_user_id: sessionUserId,
        displayName: trimmedDisplayName,
        origin: "user-created",
        setupPromptDismissed: true,
      })
      .wait({ tier: "edge" });
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
      await upsertProfile(displayName);
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

  const footer = intent === "sign-in" ? (
    <>
      Don't have an account?{" "}
      <Link to="/sign-up" className={buttonVariants({ variant: "ghost", size: "none", className: "h-auto rounded-none px-0 font-sans text-base font-medium underline underline-offset-2 hover:bg-transparent hover:text-foreground" })}>
        Sign up
      </Link>
    </>
  ) : (
    <>
      Already have an account?{" "}
      <Link to="/sign-in" className={buttonVariants({ variant: "ghost", size: "none", className: "h-auto rounded-none px-0 font-sans text-base font-medium underline underline-offset-2 hover:bg-transparent hover:text-foreground" })}>
        Sign in
      </Link>
    </>
  );

  return (
    <AuthShell description={description} footer={footer} title={title}>
      {intent === "sign-up" ? (
        <PassphraseSignUpForm
          copiedRecoveryPhrase={copiedRecoveryPhrase}
          displayName={displayName}
          isSubmitting={isSubmitting}
          recoveryPhrase={recoveryPhrase}
          onDisplayNameChange={setDisplayName}
          onSubmit={handlePassphraseSignUp}
        />
      ) : (
        <PassphraseSignInForm isSubmitting={isSubmitting} restorePhrase={restorePhrase} onRestorePhraseChange={setRestorePhrase} onSubmit={handleRestore} />
      )}
    </AuthShell>
  );
}
