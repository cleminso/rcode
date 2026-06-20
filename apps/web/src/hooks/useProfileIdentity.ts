import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { selectProfileRow } from "../lib/profile";

interface UseProfileIdentityOptions {
  confirmMissing?: boolean;
  tier?: "local" | "edge";
}

export function useProfileIdentity(sessionUserId: string | null, options?: UseProfileIdentityOptions) {
  const query = sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined;
  const shouldConfirmMissing = options?.confirmMissing === true;
  const shouldReadLocal = shouldConfirmMissing === true || options?.tier !== "edge";
  const shouldReadEdge = shouldConfirmMissing === true || options?.tier === "edge";
  const localProfileRows = useAll(shouldReadLocal === true ? query : undefined);
  const edgeProfileRows = useAll(shouldReadEdge === true ? query : undefined, { tier: "edge" });
  const singleTierProfileRows = options?.tier === "edge" ? edgeProfileRows : localProfileRows;
  const profileRows = shouldConfirmMissing === true ? localProfileRows ?? edgeProfileRows : singleTierProfileRows;
  const profile = selectProfileRow(profileRows, sessionUserId);
  const isLoading = shouldConfirmMissing === true
    ? sessionUserId !== null && localProfileRows === undefined && edgeProfileRows === undefined
    : sessionUserId !== null && profileRows === undefined;

  return {
    avatarFileId: profile?.avatarFileId ?? null,
    displayName: profile?.displayName ?? null,
    isLoading,
    isResolvedEmpty: shouldConfirmMissing === true && edgeProfileRows !== undefined && profile === null,
    profile,
    sessionUserId,
    shouldShowSetupPrompt: profile?.origin === "auto-created" && profile.setupPromptDismissed === false,
  };
}
