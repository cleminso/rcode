import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { selectProfileRow } from "../lib/profile";

interface UseProfileIdentityOptions {
  confirmMissing?: boolean;
  tier?: "local-first" | "remote";
}

export function useProfileIdentity(sessionUserId: string | null, options?: UseProfileIdentityOptions) {
  const query = sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined;
  const shouldConfirmMissing = options?.confirmMissing === true;
  const shouldReadLocal = shouldConfirmMissing === true || options?.tier !== "remote";
  const shouldReadRemote = shouldConfirmMissing === true || options?.tier === "remote";
  const localResult = useAll(shouldReadLocal === true ? query : undefined, { tier: "local-first" });
  const remoteResult = useAll(shouldReadRemote === true ? query : undefined, { tier: "remote" });
  const localProfile = selectProfileRow(localResult.data, sessionUserId);
  const remoteProfile = selectProfileRow(remoteResult.data, sessionUserId);
  const profile = shouldConfirmMissing === true
    ? localProfile ?? remoteProfile
    : options?.tier === "remote"
      ? remoteProfile
      : localProfile;
  const isLoading = shouldConfirmMissing === true
    ? sessionUserId !== null && profile === null && (localResult.isLoading === true || remoteResult.isLoading === true)
    : sessionUserId !== null && (options?.tier === "remote" ? remoteResult.isLoading : localResult.isLoading) === true;
  const error = localResult.error ?? remoteResult.error;

  if (error !== null) {
    throw error;
  }

  return {
    avatarFileId: profile?.avatarFileId ?? null,
    displayName: profile?.displayName ?? null,
    isLoading,
    isResolvedEmpty:
      shouldConfirmMissing === true &&
      sessionUserId !== null &&
      localResult.isLoading === false &&
      remoteResult.isLoading === false &&
      profile === null,
    profile,
    sessionUserId,
    shouldShowSetupPrompt: profile?.origin === "auto-created" && profile.setupPromptDismissed === false,
  };
}
