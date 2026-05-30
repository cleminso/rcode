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
  const { secret: localFirstSecret, isLoading: localFirstLoading } = useLocalFirstAuth();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();

  const [jwt, setJwt] = useState<string | null>(null);
  const [isFetchingJwt, setIsFetchingJwt] = useState(false);

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
