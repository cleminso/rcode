import { app } from "@rcode/schema";
import { useEffect, useRef } from "react";
import { useAll, useDb, useSession } from "jazz-tools/react";
import { generateUniqueName } from "../lib/awareness";

/**
 * Ensures a profiles row exists for the current Jazz session user.
 * Runs once per session at app initialization.
 *
 * For local-first / anonymous users, generates a unique name.
 * For external auth users, will later read from Better Auth profile.
 */
export function useInitProfile() {
  const db = useDb();
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const profileRows = useAll(
    sessionUserId !== null
      ? app.profiles.where({ session_user_id: sessionUserId }).limit(1)
      : undefined,
  );
  const profile = profileRows?.[0] ?? null;
  const isLoading = profileRows === undefined;
  const initializedSessionUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initializedSessionUserIdRef.current === sessionUserId) {
      return;
    }

    if (sessionUserId === null || isLoading === true) {
      return;
    }

    if (profile !== null) {
      initializedSessionUserIdRef.current = sessionUserId;
      return;
    }

    initializedSessionUserIdRef.current = sessionUserId;

    void db
      .insert(app.profiles, {
        session_user_id: sessionUserId,
        displayName: generateUniqueName(),
        isGuest: true,
      })
      .wait({ tier: "edge" })
      .catch(() => {
        if (initializedSessionUserIdRef.current === sessionUserId) {
          initializedSessionUserIdRef.current = null;
        }
      });
  }, [db, isLoading, profile, sessionUserId]);
}
