// TanStack Router uses file-based routing. `__root.tsx` is the top-level layout that wraps all other routes.
// Top-level layout that wraps every page in the app.
// TanStack Router automatically discovers this file as the root of the route tree.
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useInitProfile } from "../hooks/useInitProfile";

// Creates the root node of the route tree.
// Exported as `Route` so TanStack Router's file-based routing discovers it.
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // Initialize user profile globally on session start.
  useInitProfile();

  return <Outlet />; // placeholder where child routes render their content
}
