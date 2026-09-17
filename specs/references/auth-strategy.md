# Authentication Strategy

## Current model

rcode uses Jazz local-first authentication. A browser creates a local identity and stores its recovery secret as a passphrase. The passphrase restores the same identity on another device.

The web app supports:

- Creating a local-first identity.
- Restoring an identity from its recovery phrase.
- Logging out by switching the browser to a new local identity.

The API uses a backend Jazz session for server-side data reads such as room Open Graph images. It does not provide account, email, OTP, cookie, or JWT authentication endpoints.

## Retained schema

The Better Auth schema remains composed into the Jazz schema and its tables remain protected by the existing permissions. These tables are retained for data compatibility and are not used by the current runtime authentication flow.

## Identity and product data

Product profiles reference the active Jazz session user id. A profile is created when a user completes sign-up with a display name. Room ownership and collaboration data use Jazz session identities rather than account-table references.
