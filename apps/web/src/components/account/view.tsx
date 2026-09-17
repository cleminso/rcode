import { app } from "@rcode/schema";
import Button, { buttonVariants } from "@rcode/ui/button";
import { Input } from "@rcode/ui/input";
import { Textarea } from "@rcode/ui/textarea";
import { Link, Navigate } from "@tanstack/react-router";
import { RecoveryPhrase } from "jazz-tools/passphrase";
import { useDb, useSession } from "jazz-tools/react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLogout } from "../../hooks/useLogout";
import { useNavigationHotkeys } from "../../hooks/useNavigationHotkeys";
import { useProfileIdentity } from "../../hooks/useProfileIdentity";
import { getErrorMessage } from "../../lib/errors";
import { useRcodeJazzAuth } from "../../lib/jazzAuth";
import { toasts } from "../../lib/toasts";
import { LogoButton } from "../layout/logoButton";
import { avatarMaxBytes, isAllowedAvatarFile } from "./accountUtils";
import { ProfileAvatar } from "./profileAvatar";
import { ThemeTabs } from "./themeTabs";

function AccountSection({ children, label, right }: { children?: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <section className="flexcol-4">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-1.5 font-mono text-xs uppercase">
        <div className="flexrow-1">
          <span>/</span>
          <span>{label}</span>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function DisplayNameField(props: { onCommit: (value: string) => Promise<string>; value: string }) {
  const [inputValue, setInputValue] = useState(props.value);

  const commitValue = async (value: string) => {
    try {
      setInputValue(await props.onCommit(value));
    } catch {
      setInputValue(props.value);
    }
  };

  return (
    <Input
      className="h-8 font-mono text-xs"
      value={inputValue}
      onBlur={(event) => void commitValue(event.currentTarget.value)}
      onChange={(event) => setInputValue(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function AccountView() {
  const db = useDb();
  useNavigationHotkeys({ dashboard: true });
  const session = useSession();
  const jazzAuth = useRcodeJazzAuth();
  const { isLoggingOut, logout } = useLogout();
  const sessionUserId = session?.user.account ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId, { confirmMissing: true });
  const profile = profileIdentity.profile;
  const avatarFileId = profileIdentity.avatarFileId;
  const displayName = profile?.displayName ?? "";
  const recoveryPhrase = useMemo(() => {
    const secret = jazzAuth.getRecoverySecret();
    return secret === null ? null : RecoveryPhrase.fromSecret(secret);
  }, [jazzAuth, sessionUserId]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passphraseIsRevealed, setPassphraseIsRevealed] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileIdentity.shouldShowSetupPrompt === false || profile === null) {
      return;
    }

    void db
      .update(app.profiles, profile.id, { setupPromptDismissed: true })
      .wait({ tier: "edge" })
      .catch((error: unknown) => {
        console.error("Failed to dismiss the profile setup prompt.", error);
      });
  }, [db, profile, profileIdentity.shouldShowSetupPrompt]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl !== null) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  if (session === null && profileIdentity.isLoading === false) {
    return <Navigate replace to="/sign-up" />;
  }

  if (profileIdentity.isLoading === true) {
    return <main className="h-dvh overflow-hidden bg-background" />;
  }

  if (profileIdentity.isResolvedEmpty === true || profile?.displayName.trim() === "") {
    return <Navigate replace to="/sign-up" />;
  }

  if (profile === null) {
    return <main className="h-dvh overflow-hidden bg-background" />;
  }

  const hasCustomAvatar = avatarFileId !== null;
  const logoutDescription = "Save your passphrase first so you can recover this account. \n Logout switches this browser to a new local identity.";

  const commitDisplayName = async (value: string) => {
    const nextDisplayName = value.trim();

    if (nextDisplayName === "") {
      return profile.displayName;
    }

    if (nextDisplayName === profile.displayName) {
      return profile.displayName;
    }

    if (profile === null) {
      return displayName;
    }

    try {
      await db
        .update(app.profiles, profile.id, { displayName: nextDisplayName })
        .wait({ tier: "edge" });
      toasts.account.displayNameSaved();
      return nextDisplayName;
    } catch (caughtError) {
      toasts.account.error(getErrorMessage(caughtError));
      return profile.displayName;
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    if (file === null) {
      return;
    }

    event.currentTarget.value = "";

    if (isAllowedAvatarFile(file) === false) {
      toasts.account.avatarInvalidType();
      return;
    }

    if (file.size > avatarMaxBytes) {
      toasts.account.avatarFileTooLarge();
      return;
    }

    setIsAvatarUploading(true);
    const nextPreviewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(nextPreviewUrl);

    try {
      const fileWrite = await db.insertStreaming(app.files, {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: file.stream(),
      });
      await fileWrite.wait({ tier: "edge" });
      await db.update(app.profiles, profile.id, { avatarFileId: fileWrite.value.id }).wait({ tier: "edge" });
      setAvatarPreviewUrl(null);
      toasts.account.avatarSaved();
    } catch (caughtError) {
      setAvatarPreviewUrl(null);
      toasts.account.error(getErrorMessage(caughtError));
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
      toasts.account.avatarRemoved();
    } catch (caughtError) {
      toasts.account.error(getErrorMessage(caughtError));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const copyPassphrase = async () => {
    if (recoveryPhrase === null) {
      toasts.account.missingPassphrase();
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryPhrase);
      setPassphraseIsRevealed(true);
      toasts.account.passphraseCopied();
    } catch (error) {
      toasts.account.error(getErrorMessage(error, "Passphrase could not be copied."));
    }
  };

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <header className="flexrow-between-0 py-3">
          <div className="flexrow-2">
            <LogoButton />
            {/*<Button variant="default" onClick={() => navigate({ to: "/dashboard" })}>
              <span>[D]</span>
              <span>DASHBOARD</span>
            </Button>*/}
            <Link to="/dashboard" className={buttonVariants({ variant: "default" })}>
              <span>[D]</span>
              <span>DASHBOARD</span>
            </Link>
          </div>
          <Button variant="primary">
            <span>[A]</span>
            <span>ACCOUNT</span>
          </Button>
        </header>
      </div>
      <div className="w-full px-4 min-[1440px]:mx-auto min-[1440px]:max-w-384">
        <section className="flex max-w-183 flexcol-5 py-16">
          <AccountSection label="THEME" right={<ThemeTabs className="flexrow-4" />} />
          <AccountSection
            label="AVATAR"
            right={
              <div className="flexrow-4">
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
            <DisplayNameField
              key={`${profile.id}:${displayName}`}
              value={displayName}
              onCommit={commitDisplayName}
            />
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

          <AccountSection
            label="AUTHENTICATION"
            right={
              <div className="flexrow-6">
                <button
                  className="font-mono text-xs uppercase text-destructive outline-none hover:text-destructive/70 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isLoggingOut === true}
                  type="button"
                  onClick={() => void logout()}
                >
                  / {isLoggingOut === true ? "LOGGING OUT" : "LOGOUT"}
                </button>
              </div>
            }
          >
            <p className="text-sm text-foreground">{logoutDescription}</p>
          </AccountSection>
        </section>
      </div>
    </main>
  );
}
