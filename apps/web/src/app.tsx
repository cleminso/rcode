// Application shell: given the current auth state, how do we initialize Jazz and render the router?
import { Toaster } from "@rcode/ui/ui/sonner";
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

  // Jazz clients are bound to a single principal on a live db.
  // If a user signs in and I change jwtToken on an existing provider, Jazz keeps using the old identity.
  // The key prop forces React to unmount and remount JazzProvider, creating a fresh Jazz client with the new credentials.
  // Without this, a user who signs in would still appear as their guest identity to Jazz.
  const authKey = config.jwtToken === undefined ? "local-first" : "external";

  return (
    <JazzProvider
      key={authKey}
      config={config}
      onJWTExpired={refreshJwt} // Jazz calls it when the sync server rejects the current token as expired
      fallback={<div>Loading Jazz...</div>}
    >
      <RouterProvider router={router} />
      <Toaster />
    </JazzProvider>
  );
}
