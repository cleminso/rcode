import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useDb, useLocalFirstAuth } from "jazz-tools/react";
import { type FormEvent, useMemo, useState } from "react";
import { authClient } from "../lib/auth-client";

type LoginTab = "sign-in" | "sign-up" | "passphrase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function LoginPage() {
  const navigate = useNavigate();
  const db = useDb();
  const localFirstAuth = useLocalFirstAuth();
  const [activeTab, setActiveTab] = useState<LoginTab>("sign-in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recoveryPhrase = useMemo(() => {
    if (localFirstAuth.secret == null) return null;
    return RecoveryPhrase.fromSecret(localFirstAuth.secret);
  }, [localFirstAuth.secret]);

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    setIsSubmitting(false);

    if (result.error != null) {
      setError(result.error.message ?? "Sign in failed.");
      return;
    }

    await navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    try {
      const proofToken = await db.getLocalFirstIdentityProof({
        ttlSeconds: 60,
        audience: "betterauth-signup",
      });

      if (proofToken == null) {
        throw new Error("Sign up requires an active Jazz local-first identity.");
      }

      const result = await authClient.signUp.email({
        email,
        name,
        password,
        callbackURL: "/dashboard",
        proofToken,
      } as Parameters<typeof authClient.signUp.email>[0]);

      if (result.error != null) {
        setError(result.error.message ?? "Sign up failed.");
        return;
      }

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

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">rcode</p>
          <h1 className="text-2xl font-semibold">Connect to your workspace</h1>
          <p className="text-sm text-muted-foreground">
            Use email/password for a managed account or keep a local-first identity with a recovery phrase.
          </p>
        </div>

        <div className="grid grid-cols-3 rounded-xl bg-muted p-1 text-sm">
          <TabButton activeTab={activeTab} tab="sign-in" onSelect={setActiveTab}>
            Sign-in
          </TabButton>
          <TabButton activeTab={activeTab} tab="sign-up" onSelect={setActiveTab}>
            Sign-up
          </TabButton>
          <TabButton activeTab={activeTab} tab="passphrase" onSelect={setActiveTab}>
            Passphrase
          </TabButton>
        </div>

        {activeTab === "sign-in" ? (
          <form className="space-y-4" onSubmit={handleSignIn}>
            <AuthFields
              email={email}
              password={password}
              passwordAutoComplete="current-password"
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
            />
            <SubmitButton label="Sign in" isSubmitting={isSubmitting} />
          </form>
        ) : null}

        {activeTab === "sign-up" ? (
          <form className="space-y-4" onSubmit={handleSignUp}>
            <label className="block space-y-2 text-sm font-medium">
              <span>Name</span>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <AuthFields
              email={email}
              password={password}
              passwordAutoComplete="new-password"
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
            />
            <SubmitButton label="Create account" isSubmitting={isSubmitting} />
          </form>
        ) : null}

        {activeTab === "passphrase" ? (
          <div className="space-y-5">
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Current recovery phrase</p>
              <p className="text-xs text-muted-foreground">
                These words are the local-first account secret. Anyone with them can use this Jazz identity.
              </p>
              <div className="rounded-lg bg-background p-3 text-sm leading-6">
                {localFirstAuth.isLoading === true ? "Loading..." : recoveryPhrase ?? "No local secret found."}
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleRestore}>
              <label className="block space-y-2 text-sm font-medium">
                <span>Restore recovery phrase</span>
                <textarea
                  className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  value={restorePhrase}
                  onChange={(event) => setRestorePhrase(event.target.value)}
                  placeholder="Paste the 24-word phrase"
                  required
                />
              </label>
              <SubmitButton label="Restore identity" isSubmitting={isSubmitting} />
            </form>
          </div>
        ) : null}

        {message != null ? <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
        {error != null ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </section>
    </main>
  );
}

interface AuthFieldsProps {
  email: string;
  password: string;
  passwordAutoComplete: "current-password" | "new-password";
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

function AuthFields(props: AuthFieldsProps) {
  return (
    <>
      <label className="block space-y-2 text-sm font-medium">
        <span>Email</span>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          type="email"
          value={props.email}
          onChange={(event) => props.onEmailChange(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Password</span>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          type="password"
          value={props.password}
          onChange={(event) => props.onPasswordChange(event.target.value)}
          autoComplete={props.passwordAutoComplete}
          minLength={8}
          required
        />
      </label>
    </>
  );
}

interface SubmitButtonProps {
  label: string;
  isSubmitting: boolean;
}

function SubmitButton(props: SubmitButtonProps) {
  return (
    <button
      className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      type="submit"
      disabled={props.isSubmitting === true}
    >
      {props.isSubmitting === true ? "Working..." : props.label}
    </button>
  );
}

interface TabButtonProps {
  activeTab: LoginTab;
  tab: LoginTab;
  children: string;
  onSelect: (tab: LoginTab) => void;
}

function TabButton(props: TabButtonProps) {
  const isActive = props.activeTab === props.tab;

  return (
    <button
      className={
        isActive === true
          ? "rounded-lg bg-background px-3 py-2 font-medium shadow-sm"
          : "rounded-lg px-3 py-2 text-muted-foreground"
      }
      type="button"
      onClick={() => props.onSelect(props.tab)}
    >
      {props.children}
    </button>
  );
}
