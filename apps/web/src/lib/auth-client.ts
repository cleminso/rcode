// Browser-side Better Auth client.
// This client checks the cookie-backed Better Auth session and, with jwtClient(),
// can request a signed JWT for Jazz external auth.
// It must stay browser-safe: no process.env, no backend context, no server-only imports.

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_LOCAL_APP_URL,
  plugins: [jwtClient()],
});
