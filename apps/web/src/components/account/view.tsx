import { app } from "@rcode/schema";
import Button from "@rcode/ui/button";
import { Input } from "@rcode/ui/input";
import { OtpInput } from "@rcode/ui/otpInput";
import { Textarea } from "@rcode/ui/textarea";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useAll, useDb, useLocalFirstAuth, useSession } from "jazz-tools/react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import { selectProfileRow } from "../../lib/profile";
import { avatarMaxBytes, isAllowedAvatarFile, isValidEmail } from "./accountUtils";
import { ProfileAvatar } from "./profileAvatar";
import { ThemeTabs } from "./themeTabs";

type EmailOtpClient = {
  requestEmailChange?: (input: { newEmail: string }) => Promise<{ error?: { message?: string } | null }>;
  changeEmail?: (input: { newEmail: string; otp: string }) => Promise<{ error?: { message?: string } | null }>;
  sendVerificationOtp: (input: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>;
};

type EmailSignInClient = (input: Record<string, unknown>) => Promise<{ data?: { user?: { id?: string } }; error?: { message?: string } | null }>;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function isExistingEmailError(message: string) {
  return message.toLowerCase().includes("user already exists") || message.toLowerCase().includes("already exists for this email");
}

function AccountSection({ children, label, right }: { children?: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-1.5 font-mono text-xs uppercase">
        <div className="flex items-center gap-1">
          <span>/</span>
          <span>{label}</span>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function LogoButton() {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon-lg" onClick={() => navigate({ to: "/" })}>
      <div className="h-4 w-4 rounded-xs bg-primary" />
    </Button>
  );
}

export function AccountView() {
  const db = useDb();
  const navigate = useNavigate();
  const session = useSession();
  const localFirstAuth = useLocalFirstAuth();
  const { data: authSession } = authClient.useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
    { tier: "edge" },
  );
  const profile = selectProfileRow(profileRows, sessionUserId);
  const avatarFileId = profile?.avatarFileId ?? null;
  const isLoadingProfile = sessionUserId !== null && profileRows === undefined;
  const displayName = profile?.displayName ?? authSession?.user.name ?? "";
  const savedEmail = authSession?.user.email ?? "";
  const recoveryPhrase = useMemo(() => {
    if (localFirstAuth.secret === null || localFirstAuth.secret === undefined) return null;
    return RecoveryPhrase.fromSecret(localFirstAuth.secret);
  }, [localFirstAuth.secret]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayNameInput, setDisplayNameInput] = useState(displayName);
  const [emailInput, setEmailInput] = useState(savedEmail);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpIsInvalid, setOtpIsInvalid] = useState(false);
  const [emailIsActive, setEmailIsActive] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [passphraseIsRevealed, setPassphraseIsRevealed] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setDisplayNameInput(displayName);
  }, [displayName]);

  useEffect(() => {
    if (pendingEmail !== null) {
      return;
    }

    setEmailInput(savedEmail);
  }, [pendingEmail, savedEmail]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl !== null) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  if (session === null && isLoadingProfile === false) {
    return <Navigate replace to="/sign-up" />;
  }

  if (isLoadingProfile === true) {
    return <main className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading account...</main>;
  }

  if (profile === null || profile.displayName.trim() === "") {
    return <Navigate replace to="/sign-up" />;
  }

  const emailClient = authClient.emailOtp as unknown as EmailOtpClient;
  const emailSignIn = authClient.signIn.emailOtp as unknown as EmailSignInClient;
  const trimmedEmail = emailInput.trim().toLowerCase();
  const savedTrimmedEmail = savedEmail.trim().toLowerCase();
  const emailHasChanged = trimmedEmail !== "" && trimmedEmail !== savedTrimmedEmail;
  const canSubmitEmail = emailHasChanged === true && isValidEmail(trimmedEmail) === true && isEmailSubmitting === false;
  const hasCustomAvatar = avatarFileId !== null;

  const commitDisplayName = async (value: string) => {
    const nextDisplayName = value.trim();

    if (nextDisplayName === "") {
      setDisplayNameInput(profile.displayName);
      return;
    }

    if (nextDisplayName === profile.displayName) {
      setDisplayNameInput(profile.displayName);
      return;
    }

    if (profile === null) {
      return;
    }

    try {
      await db
        .update(app.profiles, profile.id, { displayName: nextDisplayName })
        .wait({ tier: "edge" });
      toast("Display name saved");
    } catch (caughtError) {
      setDisplayNameInput(profile.displayName);
      toast.error(getErrorMessage(caughtError));
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    if (file === null) {
      return;
    }

    event.currentTarget.value = "";

    if (isAllowedAvatarFile(file) === false) {
      toast.error("Avatar must be PNG, JPEG, or WebP.");
      return;
    }

    if (file.size > avatarMaxBytes) {
      toast.error("Avatar must be 2MB or smaller.");
      return;
    }

    setIsAvatarUploading(true);
    const nextPreviewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(nextPreviewUrl);

    try {
      const fileRow = await db.createFileFromBlob(app, file, { tier: "edge" });
      await db.update(app.profiles, profile.id, { avatarFileId: fileRow.id }).wait({ tier: "edge" });
      toast("Avatar saved");
    } catch (caughtError) {
      setAvatarPreviewUrl(null);
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (hasCustomAvatar === false || isAvatarUploading === true) {
      return;
    }

    setIsAvatarUploading(true);

    try {
      setAvatarPreviewUrl(null);
      await db.update(app.profiles, profile.id, { avatarFileId: null }).wait({ tier: "edge" });
      toast("Avatar removed");
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const requestEmailOtp = async () => {
    if (canSubmitEmail === false || sessionUserId === null) {
      return;
    }

    setIsEmailSubmitting(true);
    setOtpIsInvalid(false);

    try {
      if (savedEmail.trim() === "") {
        const proofToken = await db.getLocalFirstIdentityProof({ ttlSeconds: 60, audience: "betterauth-signup" });
        const result = await emailClient.sendVerificationOtp({ email: trimmedEmail, type: "sign-in", proofToken });

        if (result.error !== null && result.error !== undefined) {
          throw new Error(result.error.message ?? "Could not send verification code.");
        }
      } else {
        if (emailClient.requestEmailChange === undefined) {
          throw new Error("Email change is not available.");
        }

        const result = await emailClient.requestEmailChange({ newEmail: trimmedEmail });

        if (result.error !== null && result.error !== undefined) {
          throw new Error(result.error.message ?? "Could not send verification code.");
        }
      }

      setPendingEmail(trimmedEmail);
      setOtp("");
      toast(`Code sent to ${trimmedEmail}`);
    } catch (caughtError) {
      const message = getErrorMessage(caughtError);

      if (isExistingEmailError(message) === true) {
        toast.error("A user already exists for this email.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const verifyEmailOtp = async (nextOtp: string) => {
    if (pendingEmail === null || nextOtp.length !== 6 || sessionUserId === null) {
      return;
    }

    setIsEmailSubmitting(true);
    setOtpIsInvalid(false);

    try {
      if (savedEmail.trim() === "") {
        const proofToken = await db.getLocalFirstIdentityProof({ ttlSeconds: 60, audience: "betterauth-signup" });
        const result = await emailSignIn({ email: pendingEmail, otp: nextOtp, name: profile.displayName, proofToken });

        if (result.error !== null && result.error !== undefined) {
          throw new Error(result.error.message ?? "Verification failed.");
        }

        if (result.data?.user?.id !== sessionUserId) {
          await authClient.signOut();
          throw new Error("This email is linked to another identity.");
        }
      } else {
        if (emailClient.changeEmail === undefined) {
          throw new Error("Email change is not available.");
        }

        const result = await emailClient.changeEmail({ newEmail: pendingEmail, otp: nextOtp });

        if (result.error !== null && result.error !== undefined) {
          throw new Error(result.error.message ?? "Verification failed.");
        }
      }

      setPendingEmail(null);
      setEmailIsActive(false);
      setOtp("");
      toast("Email verified");
      await navigate({ to: "/account" });
    } catch (caughtError) {
      setOtp("");
      setOtpIsInvalid(true);
      toast.error(getErrorMessage(caughtError));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const updateOtp = (nextOtp: string) => {
    setOtp(nextOtp);

    if (nextOtp.length === 6 && isEmailSubmitting === false) {
      void verifyEmailOtp(nextOtp);
    }
  };

  const copyPassphrase = async () => {
    if (recoveryPhrase === null) {
      toast.error("No passphrase is available.");
      return;
    }

    await navigator.clipboard.writeText(recoveryPhrase);
    setPassphraseIsRevealed(true);
    toast("Passphrase copied");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <LogoButton />
            <Button variant="default" onClick={() => navigate({ to: "/dashboard" })}>
              <span>[D]</span>
              <span>DASHBOARD</span>
            </Button>
          </div>
          <Button variant="primary">
            <span>[A]</span>
            <span>ACCOUNT</span>
          </Button>
        </header>
      </div>
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <section className="flex max-w-183 flex-col gap-6 py-24">
          <AccountSection label="THEME" right={<ThemeTabs className="flex items-center gap-4" />} />
          <AccountSection
            label="AVATAR"
            right={
              <div className="flex items-center gap-4">
                <button
                  className="font-mono text-xs uppercase outline-none hover:text-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isAvatarUploading === true}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  / {isAvatarUploading === true ? "UPLOADING" : "SELECT"}
                </button>
                {hasCustomAvatar === true ? (
                  <button
                    className="font-mono text-xs uppercase text-destructive outline-none hover:text-destructive/70 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                    disabled={isAvatarUploading === true}
                    type="button"
                    onClick={() => void removeAvatar()}
                  >
                    / REMOVE
                  </button>
                ) : null}
              </div>
            }
          >
            <div className="flex items-center">
              <button
                className="rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                disabled={isAvatarUploading === true}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <ProfileAvatar
                  avatarFileId={avatarPreviewUrl !== null ? null : avatarFileId}
                  className="size-14 rounded-xs"
                  displayName={displayName}
                  imageClassName="rounded-xs text-xs"
                  imageUrl={avatarPreviewUrl}
                  size="lg"
                />
              </button>
              <input ref={fileInputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
            </div>
          </AccountSection>

          <AccountSection label="DISPLAY NAME">
            <Input
              className="h-8 font-mono text-xs"
              value={displayNameInput}
              onBlur={(event) => void commitDisplayName(event.currentTarget.value)}
              onChange={(event) => setDisplayNameInput(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </AccountSection>

          <AccountSection label="EMAIL" right={<span>OPTIONAL</span>}>
            <form
              className="flex gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void requestEmailOtp();
              }}
            >
              <Input
                aria-invalid={otpIsInvalid === true}
                className="h-8 flex-1 font-mono text-xs"
                value={emailInput}
                onBlur={() => {
                  if (emailHasChanged === false && pendingEmail === null) {
                    setEmailIsActive(false);
                  }
                }}
                onChange={(event) => {
                  setEmailInput(event.currentTarget.value);
                  setEmailIsActive(true);
                }}
                onFocus={() => setEmailIsActive(true)}
              />
              {emailIsActive === true || pendingEmail !== null ? (
                <Button className="h-8 w-50 text-xs uppercase" disabled={canSubmitEmail === false} type="submit" variant="outline">
                  Enter
                </Button>
              ) : null}
            </form>
            {pendingEmail !== null ? (
              <OtpInput
                aria-invalid={otpIsInvalid === true}
                containerClassName={otpIsInvalid === true ? "text-destructive" : undefined}
                value={otp}
                onChange={updateOtp}
                autoFocus
              />
            ) : null}
          </AccountSection>

          <AccountSection label="PASSPHRASE">
            <Textarea
              aria-label="Passphrase"
              className="min-h-20 resize-none font-mono text-sm leading-5 text-muted-foreground transition-[filter] duration-200 read-only:cursor-default"
              readOnly
              rows={4}
              style={{ filter: passphraseIsRevealed === true ? "none" : "blur(5px)" }}
              tabIndex={passphraseIsRevealed === true ? 0 : -1}
              value={recoveryPhrase ?? "No passphrase available for this identity."}
            />
            <Button
              className="h-8 w-full text-xs uppercase"
              variant="primary"
              onClick={() => {
                if (passphraseIsRevealed === true) {
                  setPassphraseIsRevealed(false);
                } else {
                  void copyPassphrase();
                }
              }}
            >
              {passphraseIsRevealed === true ? "I SAVED IT - HIDE" : "SHOW & COPY PASSPHRASE"}
            </Button>
          </AccountSection>
        </section>
      </div>
    </main>
  );
}
