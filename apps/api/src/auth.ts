// Server-side Better Auth configuration.
// Configures how the server sends email OTP codes, manages sessions, and issues JWTs for Jazz.
// This file wires Better Auth to Jazz as its database adapter and enables the JWT plugin.
// The JWT subject becomes Jazz's external `session.user_id`, so it must stay stable.
// Keep this out of the browser bundle: it uses process.env and jazz-tools/backend.
import { app as schemaApp } from "@rcode/schema";
import permissions from "@rcode/schema/permissions";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP, jwt } from "better-auth/plugins";
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

function getStringBodyField(body: unknown, fieldName: string) {
  if (typeof body !== "object" || body === null || !(fieldName in body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[fieldName];
  return typeof value === "string" ? value : null;
}

function getOptionalProofToken(body: unknown) {
  if (typeof body !== "object" || body === null || !("proofToken" in body)) {
    return null;
  }

  const proofToken = (body as Record<string, unknown>).proofToken;

  if (proofToken === undefined || proofToken === null) {
    return null;
  }

  if (typeof proofToken !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Local-first identity proof must be a string.",
    });
  }

  return proofToken;
}

async function verifySignupProof(proofToken: string) {
  const { verifyLocalFirstIdentityProof } = await import("jazz-napi");
  const proof = verifyLocalFirstIdentityProof(proofToken, "betterauth-signup");

  if (proof.ok === false) {
    throw new APIError("BAD_REQUEST", {
      message: proof.error,
    });
  }

  return proof.id;
}

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  basePath: env.betterAuthBasePath,
  trustedOrigins: [env.appUrl, env.betterAuthUrl],
  database: jazzAdapter({
    db: () => jazzContext.asBackend(schemaApp),
    schema: schemaApp.wasmSchema,
  }),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/email-otp/send-verification-otp" && ctx.path !== "/sign-in/email-otp") return;

      const email = getStringBodyField(ctx.body, "email");

      if (email === null) {
        throw new APIError("BAD_REQUEST", {
          message: "Email is required.",
        });
      }

      const user = await ctx.context.internalAdapter.findUserByEmail(email.trim().toLowerCase());
      const userExists = user !== null;
      const proofToken = getOptionalProofToken(ctx.body);

      if (proofToken === null) {
        if (userExists === false) {
          throw new APIError("BAD_REQUEST", {
            message: "No user found for this email. Try signing up first.",
          });
        }

        return;
      }

      if (userExists === true) {
        throw new APIError("BAD_REQUEST", {
          message: "A user already exists for this email. Try signing in instead.",
        });
      }

      const provedUserId = await verifySignupProof(proofToken);

      if (ctx.path === "/email-otp/send-verification-otp") {
        return;
      }

      return {
        context: {
          ...ctx,
          body: {
            ...ctx.body,
            provedUserId,
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
            throw new APIError("BAD_REQUEST", {
              message: "Account creation requires a local-first identity proof.",
            });
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
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV !== "production") {
          console.info(`[rcode] Better Auth ${type} OTP for ${email}: ${otp}`);
          return;
        }

        if (env.emailOtpWebhookUrl === undefined) {
          throw new Error("EMAIL_OTP_WEBHOOK_URL is required to send email OTP codes in production.");
        }

        const response = await fetch(env.emailOtpWebhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, otp, type }),
        });

        if (response.ok === false) {
          throw new Error("Email OTP delivery failed.");
        }
      },
    }),
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
