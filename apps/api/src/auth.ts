// Server-side Better Auth configuration.
// Configures how the server validates passwords, manages sessions, and issues JWTs for Jazz.
// This file wires Better Auth to Jazz as its database adapter and enables the JWT plugin.
// The JWT subject becomes Jazz's external `session.user_id`, so it must stay stable.
// Keep this out of the browser bundle: it uses process.env and jazz-tools/backend.
import { app as schemaApp } from "@rcode/schema";
import permissions from "@rcode/schema/permissions";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { createJazzContext } from "jazz-tools/backend";
import { jazzAdapter } from "jazz-tools/better-auth-adapter";
import { env } from "./env";

const jazzContext = createJazzContext({
  appId: env.jazzAppId,
  app: schemaApp,
  permissions,
  driver: { type: "memory" },
  serverUrl: env.jazzServerUrl,
  env: process.env.NODE_ENV === "production" ? "prod" : "dev",
  userBranch: "main",
  backendSecret: env.backendSecret,
});

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  basePath: env.betterAuthBasePath,
  trustedOrigins: [env.appUrl, env.betterAuthUrl],
  database: jazzAdapter({
    db: () => jazzContext.asBackend(schemaApp),
    schema: schemaApp.wasmSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const proofToken = ctx.body?.proofToken;

      if (typeof proofToken !== "string") {
        throw new APIError("BAD_REQUEST", {
          message: "Sign up requires a local-first identity proof.",
        });
      }

      const { verifyLocalFirstIdentityProof } = await import("jazz-napi");
      const proof = verifyLocalFirstIdentityProof(
        proofToken,
        "betterauth-signup",
      );

      if (proof.ok === false) {
        throw new APIError("BAD_REQUEST", {
          message: proof.error,
        });
      }

      return {
        context: {
          ...ctx,
          body: {
            ...ctx.body,
            provedUserId: proof.id,
          },
        },
      };
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const provedUserId = ctx?.body?.provedUserId;

          if (typeof provedUserId !== "string") {
            return { data: user };
          }

          return {
            data: {
              ...user,
              id: provedUserId,
            },
          };
        },
      },
    },
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        issuer: env.betterAuthUrl,
        audience: env.betterAuthUrl,
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
