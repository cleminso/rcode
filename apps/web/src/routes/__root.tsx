// TanStack Router uses file-based routing. `__root.tsx` is the top-level layout that wraps all other routes.
// Top-level layout that wraps every page in the app.
// TanStack Router automatically discovers this file as the root of the route tree.
import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { JazzProvider } from "jazz-tools/react";
import { useAuthConfig } from "../hooks/useAuthConfig";

// Creates the root node of the route tree.
// Exported as `Route` so TanStack Router's file-based routing discovers it.
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname.startsWith("/s/") === true) {
    return <AnonymousJazzLayout />;
  }

  return <AuthenticatedJazzLayout />;
}

function AnonymousJazzLayout() {
  const config = {
    appId: import.meta.env.VITE_JAZZ_APP_ID,
    serverUrl: import.meta.env.VITE_JAZZ_SERVER_URL,
  };

  return (
    <JazzProvider key="anonymous" config={config}>
      <Outlet />
    </JazzProvider>
  );
}

function AuthenticatedJazzLayout() {
  const { config, isLoading, refreshJwt, sessionKey } = useAuthConfig();

  if (isLoading === true) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading auth...</div>;
  }

  const authKey = config.jwtToken === undefined ? `local-first:${sessionKey}` : `external:${sessionKey}`;

  return (
    <JazzProvider key={authKey} config={config} onJWTExpired={refreshJwt}>
      <Outlet />
    </JazzProvider>
  );
}
