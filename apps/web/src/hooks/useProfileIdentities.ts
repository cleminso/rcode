import { app } from "@rcode/schema";
import { useAll } from "jazz-tools/react";
import { useMemo } from "react";

export interface ProfileIdentitySummary {
  avatarFileId: string | null;
  displayName: string;
}

export function useProfileIdentities(sessionUserIds: readonly string[]) {
  const sessionUserIdsKey = sessionUserIds.join("\n");
  const requestedSessionUserIds = useMemo(
    () => (sessionUserIdsKey === "" ? [] : sessionUserIdsKey.split("\n")),
    [sessionUserIdsKey],
  );
  const result = useAll(
    requestedSessionUserIds.length > 0
      ? app.profiles.where({ session_user_id: { in: requestedSessionUserIds } })
      : undefined,
  );
  const profilesBySessionUserId = useMemo(() => {
    const profiles = new Map<string, ProfileIdentitySummary>();

    for (const profile of result.data ?? []) {
      if (profiles.has(profile.session_user_id) === false) {
        profiles.set(profile.session_user_id, {
          avatarFileId: profile.avatarFileId ?? null,
          displayName: profile.displayName,
        });
      }
    }

    return profiles;
  }, [result.data]);

  if (result.error !== null) {
    throw result.error;
  }

  return {
    isLoading: requestedSessionUserIds.length > 0 && result.isLoading === true,
    profilesBySessionUserId,
  };
}
