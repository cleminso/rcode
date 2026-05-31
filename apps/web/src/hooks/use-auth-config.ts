// Which auth mode the app should use based on the user's session state?
// We implement a dual-auth pattern:
// 1. `local-first` - users can start immediately without signing up. Their identity is a device secret.
// 2. `external` - when users log in via Better Auth, the app switches to JWT mode.
// Local-first and external are mutually exclusive in this hook.
// (Identity upgrade between modes is a separate concern and not implemented here.)
import { useEffect, useMemo, useState } from "react";
import { useLocalFirstAuth } from "jazz-tools/react";
import { authClient } from "../lib/auth-client";

export interface AuthConfig {
  appId: string;
  serverUrl: string;
  jwtToken?: string;
  secret?: string;
}

async function getJwtFromBetterAuth() {
  const { data, error } = await authClient.token();

  if (error !== null) {
    return null;
  }

  return data.token;
}

export function useAuthConfig() {
  // loads/generates local secret for local-first auth.
  const { secret: localFirstSecret, isLoading: localFirstLoading } = useLocalFirstAuth();
  // checks if a user has a server session.
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();

  const [jwt, setJwt] = useState<string | null>(null);
  const [isFetchingJwt, setIsFetchingJwt] = useState(false);

  // Refetch JWT whenever the active session identity changes.
  // The dependency on `session.id` ensures we react to login/logout/switch.
  useEffect(() => {
    if (sessionPending === true) return;

    if (sessionData?.session == null) {
      setJwt(null);
      return;
    }

    setIsFetchingJwt(true);

    void getJwtFromBetterAuth()
      .then((token) => {
        setJwt(token);
      })
      .finally(() => {
        setIsFetchingJwt(false);
      });
  }, [sessionPending, sessionData?.session?.id]);

  // Memoize so `JazzProvider` only re-renders when `jwt` or `localFirstSecret` actually change.
  const config = useMemo<AuthConfig>(() => {
    const secret = jwt === null ? (localFirstSecret ?? undefined) : undefined;

    return {
      appId: import.meta.env.VITE_JAZZ_APP_ID,
      serverUrl: import.meta.env.VITE_JAZZ_SERVER_URL,
      jwtToken: jwt ?? undefined,
      secret,
    };
  }, [jwt, localFirstSecret]);

  const refreshJwt = async () => {
    const token = await getJwtFromBetterAuth();
    setJwt(token);
    return token;
  };

  return {
    config,
    isLoading: localFirstLoading || sessionPending || isFetchingJwt,
    refreshJwt,
  };
}
