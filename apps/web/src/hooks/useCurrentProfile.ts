import { app } from "@rcode/schema";
import { useDb, useSession } from "jazz-tools/react";
import { useEffect, useRef } from "react";
import { generateUniqueName } from "../lib/awareness";
import { useProfileIdentity } from "./useProfileIdentity";

interface UseCurrentProfileArgs {
  autoCreate: boolean;
}

export function useCurrentProfile(args: UseCurrentProfileArgs) {
  const db = useDb();
  const session = useSession();
  const generatedDisplayNameRef = useRef<string | null>(null);
  const profileWriteRef = useRef<Promise<void> | null>(null);
  const sessionUserId = session?.user_id ?? null;
  const profileIdentity = useProfileIdentity(sessionUserId, { confirmMissing: args.autoCreate });
  const profile = profileIdentity.profile;

  useEffect(() => {
    if (args.autoCreate === false || sessionUserId === null || profileIdentity.isResolvedEmpty === false) {
      return;
    }

    const generatedDisplayName = generatedDisplayNameRef.current ?? generateUniqueName();
    generatedDisplayNameRef.current = generatedDisplayName;

    if (profileWriteRef.current === null) {
      profileWriteRef.current = db
        .insert(app.profiles, {
          session_user_id: sessionUserId,
          displayName: generatedDisplayName,
          origin: "auto-created",
          setupPromptDismissed: false,
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
  }, [args.autoCreate, db, profileIdentity.isResolvedEmpty, sessionUserId]);

  return {
    displayName: profileIdentity.displayName,
    avatarFileId: profileIdentity.avatarFileId,
    isLoading: sessionUserId !== null && (profileIdentity.isLoading === true || (args.autoCreate === true && profile === null)),
    profile,
    sessionUserId,
    shouldShowSetupPrompt: profileIdentity.shouldShowSetupPrompt,
  };
}
