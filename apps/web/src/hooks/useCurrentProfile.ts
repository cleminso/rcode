import { app } from "@rcode/schema";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { useEffect, useRef } from "react";
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
  const profile = profileRows?.[0] ?? null;
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

  return {
    displayName: profile?.displayName ?? generatedDisplayName,
    isLoading: sessionUserId !== null && profileRows === undefined,
    profile,
    sessionUserId,
  };
}
