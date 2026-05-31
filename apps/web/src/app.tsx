// Application shell: given the current auth state, how do we initialize Jazz and render the router?
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { JazzProvider } from "jazz-tools/react";
import { useAuthConfig } from "./hooks/use-auth-config";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree }); // consumes the generated route tree

// Registers router type globally for TypeScript.
// This enables typed hooks like useRouter() across the app.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  // Gets the current auth configuration.
  const { config, isLoading, refreshJwt } = useAuthConfig();

  if (isLoading === true) {
    return <div>Loading auth...</div>;
  }

  // Jazz clients are bound to a single principal.
  // When auth mode changes, the key prop forces a remount to create a fresh client.
  const authKey = config.jwtToken === undefined ? "local-first" : "external";

  return (
    <JazzProvider
      key={authKey}
      config={config}
      onJWTExpired={refreshJwt} // Jazz calls it when the sync server rejects the current token as expired
      fallback={<div>Loading Jazz...</div>}
    >
      <RouterProvider router={router} />
    </JazzProvider>
  );
}
