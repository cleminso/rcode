import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { selectProfileRow } from "../lib/profile";

interface UseProfileIdentityOptions {
  tier?: "local" | "edge";
}

export function useProfileIdentity(sessionUserId: string | null, options?: UseProfileIdentityOptions) {
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
    options,
  );
  const profile = selectProfileRow(profileRows, sessionUserId);

  return {
    avatarFileId: profile?.avatarFileId ?? null,
    displayName: profile?.displayName ?? null,
    isLoading: sessionUserId !== null && profileRows === undefined,
    profile,
    sessionUserId,
  };
}
