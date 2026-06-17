## Table of Contents

- [Problem Statement](#problem-statement)
- [Why `apps/api` Exists](#why-appsapi-exists)
- [Auth Systems](#auth-systems)
- [Jazz Sync URL vs JWKS URL](#jazz-sync-url-vs-jwks-url)
- [Runtime Flow](#runtime-flow)
- [Implementation Shape](#implementation-shape)
- [Environment](#environment)
- [Local Development](#local-development)
- [What the API Should Not Own](#what-the-api-should-not-own)
- [Future Improvements](#future-improvements)

## Problem Statement

rcode has two collaboration entry paths:

- users can start editing immediately as Jazz `local-first` users
- users can sign in with Better Auth and use Jazz `external` auth

Those paths need to converge on one app-facing identity: Jazz `session.user_id`.

The confusing part is that Better Auth, the web app, and the Jazz sync server each solve a different auth problem. `apps/api` exists to host the server-only Better Auth pieces while product data remains local-first through Jazz.

## Why `apps/api` Exists

Better Auth is not a browser-only library and is not served by the Jazz sync server. It needs app-owned HTTP endpoints for account/session workflows.

`apps/api` provides:

- `/auth/*` Better Auth endpoints
- `/auth/token` through the Better Auth JWT client plugin
- `/auth/jwks` through the Better Auth JWT/JWKS plugin
- Better Auth storage through the Jazz adapter
- local-first proof verification during sign-up
- health endpoints for local and deployment checks

The Jazz sync server validates external JWTs, but it does not handle Better Auth sign-in, cookies, account creation, or email OTP flows. The API is the bridge between Better Auth account infrastructure and Jazz external auth.

## Auth Systems

### App authentication

Problem: can the user sign in, sign out, keep a session, and receive a JWT?

Solved by:

- Better Auth in `apps/api`
- Hono route mount at `/auth/*`
- `authClient` in the web app
- Better Auth session cookies

### Jazz data access

Problem: when a client reads or writes Jazz rows, which `session.user_id` and permissions apply?

Solved by:

- `JazzProvider` in the web app
- Jazz `local-first` auth for guest editors
- Jazz `external` auth for signed-in users
- row-level permissions in `@rcode/schema`

### Jazz server JWT validation

Problem: when a client connects to Jazz with an external JWT, how does Jazz know it is valid?

Solved by:

- Better Auth JWT plugin issuing a JWT
- Better Auth JWKS exposed at `/auth/jwks`
- Jazz sync configuration pointing to that JWKS URL or equivalent public key material

For production, the JWKS URL should be reachable by the Jazz sync server, for example `https://api.rcode.dev/auth/jwks`.

## Jazz Sync URL vs JWKS URL

The Jazz sync server URL and Better Auth JWKS URL are different endpoints.

- Jazz sync URL: where clients sync Jazz data, for example `https://v2.sync.jazz.tools/`.
- JWKS URL: where Jazz fetches Better Auth public signing keys, for example `https://api.rcode.dev/auth/jwks`.

The browser connects to the Jazz sync URL with a JWT. The Jazz sync server verifies that JWT by fetching public key material from the JWKS URL. The JWKS URL is not the Jazz sync server URL.

## Runtime Flow

### Guest local-first flow

1. User opens the web app.
2. `useLocalFirstAuth()` creates or loads a Jazz local-first secret.
3. `JazzProvider` connects with `secret` and no JWT.
4. Jazz derives `session.user_id` from the local-first identity.
5. Room data writes go directly through Jazz permissions.

### Sign-up upgrade flow

1. User starts as a local-first Jazz identity.
2. Web app asks Jazz for a local-first identity proof.
3. Web app submits email plus `proofToken` to start Better Auth email OTP sign-up.
4. User verifies the OTP.
5. `apps/api` verifies the proof with `verifyLocalFirstIdentityProof(..., "betterauth-signup")`.
6. Better Auth stores the proven Jazz id as the Better Auth user id.
7. Future JWTs use that id as `sub`.
8. Existing rooms and profile rows still point to the same `session.user_id`.

### Signed-in external flow

1. User signs in through Better Auth `/auth/*` endpoints.
2. Better Auth stores account/session data through the Jazz adapter.
3. Web app requests a JWT using `authClient.token()`.
4. `JazzProvider` connects with `jwtToken` instead of local-first `secret`.
5. Jazz external auth uses the JWT `sub` as `session.user_id`.
6. Product data reads and writes continue through Jazz permissions.

## Implementation Shape

`apps/api` is intentionally narrow:

- `src/index.ts`: Node server entry and graceful shutdown.
- `src/app.ts`: Hono app composition, scoped CORS, health routes, auth routes.
- `src/auth.ts`: Better Auth config, Jazz adapter, JWT/JWKS plugin, local-first proof hook.
- `src/env.ts`: API env loading and required server config.
- `src/routes/auth.ts`: Better Auth Hono bridge at `/auth/*`.
- `src/routes/health.ts`: liveness endpoints.

`@rcode/schema` exports both the Jazz app schema and permissions from the root package:

- `app`: Jazz schema app.
- `permissions`: row-level permission bundle.

The API imports both from `@rcode/schema` and passes them into the Jazz backend context.

## Environment

The web app and API have separate env examples because they run in different environments.

Web env is browser-visible and must use `VITE_*` keys:

- `VITE_AUTH_BASE_URL`
- `VITE_JAZZ_APP_ID`
- `VITE_JAZZ_SERVER_URL`

API env is server-only and must not depend on Vite-prefixed keys:

- `JAZZ_APP_ID`
- `JAZZ_SERVER_URL`
- `BACKEND_SECRET`
- `BETTER_AUTH_SECRET`

Optional API values have local defaults:

- `APP_URL` defaults to `https://rcode.localhost`
- `BETTER_AUTH_URL` defaults to `https://api.rcode.localhost`
- `BETTER_AUTH_BASE_PATH` defaults to `/auth`
- `HOST` defaults to `127.0.0.1`
- `PORT` defaults to the port assigned by Portless, or `4000` when running without Portless

## Local Development

Portless provides stable local hostnames while assigning internal app ports:

- web: `https://rcode.localhost`
- API: `https://api.rcode.localhost`

The API script lets Portless choose an internal port. This avoids port collisions while keeping the human-readable API URL stable.

The web Vite dev proxy targets `VITE_AUTH_BASE_URL`, so `/api/*` and `/auth/*` can be called from the web origin and proxied to the API hostname.

## What the API Should Not Own

The API should not implement normal product data routes such as:

- creating rooms
- updating room metadata
- joining rooms
- writing Yjs updates
- writing room participant history
- listing dashboard rooms

Those are Jazz data operations. They should be performed by the web app through Jazz client mutations and enforced by Jazz permissions.

API endpoints are appropriate only when the operation is server-only, such as account/session handling, webhooks, email delivery, or deployment health checks.
