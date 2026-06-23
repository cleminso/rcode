// Application shell: given the current auth state, how do we initialize Jazz and render the router?
import { Toaster } from "@rcode/ui/ui/sonner";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// consumes the generated route tree
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Registers router type globally for TypeScript.
// This enables typed hooks like useRouter() across the app.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <HotkeysProvider>
      <RouterProvider router={router} />
      <Toaster />
    </HotkeysProvider>
  );
}
