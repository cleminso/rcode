import { RouterProvider, createRouter } from "@tanstack/react-router";
import { JazzProvider } from "jazz-tools/react";
import { useAuthConfig } from "./hooks/use-auth-config";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { config, isLoading, refreshJwt } = useAuthConfig();

  if (isLoading === true) {
    return <div>Loading auth...</div>;
  }

  const authKey = config.jwtToken === undefined ? "local-first" : "external";

  return (
    <JazzProvider
      key={authKey}
      config={config}
      onJWTExpired={refreshJwt}
      fallback={<div>Loading Jazz...</div>}
    >
      <RouterProvider router={router} />
    </JazzProvider>
  );
}
