import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { selectProfileRow } from "../lib/profile";

interface UseProfileIdentityOptions {
  confirmMissing?: boolean;
  tier?: "local" | "edge";
}

export function useProfileIdentity(sessionUserId: string | null, options?: UseProfileIdentityOptions) {
  const query = sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined;
  const localProfileRows = useAll(query);
  const edgeProfileRows = useAll(query, { tier: "edge" });
  const shouldConfirmMissing = options?.confirmMissing === true;
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
  };
}
