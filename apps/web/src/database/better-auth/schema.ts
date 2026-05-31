// Better-Auth needs to store user accounts, sessions, verification codes and JWKS keys.
// Since Jazz is used as the database for Better-Auth via `jazzAdapter`, this file defines the tables that Better-Auth expects.
import { schema as s } from "jazz-tools";

export const schema = {
  // Stores identity information for users.
  better_auth_user: s.table({
    name: s.string(),
    email: s.string(),
    emailVerified: s.boolean(),
    image: s.string().optional(),
    createdAt: s.timestamp(),
    updatedAt: s.timestamp(),
  }),

  // Stores active user sessions.
  better_auth_session: s.table({
    expiresAt: s.timestamp(),
    token: s.string(),
    createdAt: s.timestamp(),
    updatedAt: s.timestamp(),
    ipAddress: s.string().optional(),
    userAgent: s.string().optional(),
    userId: s.ref("better_auth_user"),
  }),

  // Stores user accounts linked to external providers.
  better_auth_account: s.table({
    accountId: s.string(),
    providerId: s.string(),
    userId: s.ref("better_auth_user"),
    accessToken: s.string().optional(),
    refreshToken: s.string().optional(),
    idToken: s.string().optional(),
    accessTokenExpiresAt: s.timestamp().optional(),
    refreshTokenExpiresAt: s.timestamp().optional(),
    scope: s.string().optional(),
    password: s.string().optional(),
    createdAt: s.timestamp(),
    updatedAt: s.timestamp(),
  }),

  // Stores verification codes for email verification.
  better_auth_verification: s.table({
    identifier: s.string(),
    value: s.string(),
    expiresAt: s.timestamp(),
    createdAt: s.timestamp(),
    updatedAt: s.timestamp(),
  }),

  // Stores JWT signing key pairs used by the JWT plugin to sign and verify tokens.
  better_auth_jwks: s.table({
    publicKey: s.string(),
    privateKey: s.string(),
    createdAt: s.timestamp(),
    expiresAt: s.timestamp().optional(),
  }),
};

// `app` and `wasmSchema` are re-exported here for convenience,
// but the canonical app instance lives in ../schema.ts after composition.
type AppSchema = s.Schema<typeof schema>;
export const app: s.App<AppSchema> = s.defineApp(schema);
export const wasmSchema = app.wasmSchema;
