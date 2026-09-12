async function createRcodeAuthClient() {
  const [{ createAuthClient }, { emailOTPClient, jwtClient }] = await Promise.all([
    import("better-auth/react"),
    import("better-auth/client/plugins"),
  ]);

  return createAuthClient({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL ?? import.meta.env.VITE_LOCAL_APP_URL,
    basePath: "/auth",
    plugins: [emailOTPClient(), jwtClient()],
    sessionOptions: {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      refetchWhenOffline: false,
    },
  });
}

let authClientPromise: ReturnType<typeof createRcodeAuthClient> | null = null;

export function getAuthClient() {
  if (authClientPromise === null) {
    const pendingAuthClient = createRcodeAuthClient();
    authClientPromise = pendingAuthClient;

    void pendingAuthClient.catch(() => {
      if (authClientPromise === pendingAuthClient) {
        authClientPromise = null;
      }
    });
  }

  return authClientPromise;
}
