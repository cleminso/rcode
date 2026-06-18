import { app } from "@rcode/schema";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { useEffect, useRef } from "react";
import { getCachedAvatarFileId, setCachedAvatarFileId } from "../components/account/accountUtils";
import { generateUniqueName } from "../lib/awareness";

interface UseCurrentProfileArgs {
  autoCreate: boolean;
}

export function useCurrentProfile(args: UseCurrentProfileArgs) {
  const db = useDb();
  const session = useSession();
  const generatedDisplayNameRef = useRef<string | null>(null);
  const profileWriteRef = useRef<Promise<void> | null>(null);
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null ? app.profiles.where({ session_user_id: sessionUserId }).limit(1) : undefined,
    { tier: "edge" },
  );
  const avatarRows = useAll(
    sessionUserId !== null ? app.profileAvatars.where({ session_user_id: sessionUserId }).orderBy("createdAt", "desc").limit(1) : undefined,
    { tier: "local" },
  );
  const profile = profileRows?.[0] ?? null;
  const avatar = avatarRows?.[0] ?? null;
  const avatarFileId = avatarRows === undefined ? getCachedAvatarFileId(sessionUserId) : (avatar?.fileId ?? null);
  const generatedDisplayName = generatedDisplayNameRef.current ?? generateUniqueName();

  generatedDisplayNameRef.current = generatedDisplayName;

  useEffect(() => {
    if (args.autoCreate === false || sessionUserId === null || profileRows === undefined || profile !== null) {
      return;
    }

    if (profileWriteRef.current === null) {
      profileWriteRef.current = db
        .insert(app.profiles, {
          session_user_id: sessionUserId,
          displayName: generatedDisplayName,
        })
        .wait({ tier: "edge" })
        .then(() => undefined)
        .catch((caughtError: unknown) => {
          console.error("Failed to create current profile.", caughtError);
        })
        .finally(() => {
          profileWriteRef.current = null;
        });
    }
  }, [args.autoCreate, db, generatedDisplayName, profile, profileRows, sessionUserId]);

  useEffect(() => {
    if (sessionUserId === null || avatarRows === undefined) {
      return;
    }

    setCachedAvatarFileId(sessionUserId, avatar?.fileId ?? null);
  }, [avatar?.fileId, avatarRows, sessionUserId]);

  return {
    displayName: profile?.displayName ?? generatedDisplayName,
    avatarFileId,
    isLoading: sessionUserId !== null && profileRows === undefined,
    profile,
    sessionUserId,
  };
}
