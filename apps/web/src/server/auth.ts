// Server-side Better Auth configuration.
// This file wires Better Auth to Jazz as its database adapter and enables the JWT plugin.
// The JWT subject becomes Jazz's external `session.user_id`, so it must stay stable.
// Keep this out of the browser bundle: it uses process.env and jazz-tools/backend.

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { createJazzContext } from "jazz-tools/backend";
import { jazzAdapter } from "jazz-tools/better-auth-adapter";
import { app } from "../database/schema";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.VITE_LOCAL_APP_URL;

const jazzContext = createJazzContext({
  appId: process.env.VITE_JAZZ_APP_ID!,
  driver: { type: "memory" },
  serverUrl: process.env.VITE_JAZZ_SERVER_URL!,
  env: process.env.NODE_ENV === "production" ? "prod" : "dev",
  userBranch: "main",
  backendSecret: process.env.BACKEND_SECRET!,
});

export const auth = betterAuth({
  database: jazzAdapter({
    db: () => jazzContext.asBackend(app),
    schema: app.wasmSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        issuer: authBaseUrl,
        audience: authBaseUrl,
        getSubject: ({ user }) => user.id,
        definePayload: ({ user }) => ({
          claims: {
            email: user.email,
            emailVerified: user.emailVerified,
          },
        }),
      },
    }),
  ],
});
