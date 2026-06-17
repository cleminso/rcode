## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [App API Boundary](#app-api-boundary)
- [User Journeys](#user-journeys)
- [Identity Model](#identity-model)
- [Schema Responsibilities](#schema-responsibilities)
- [Implementation Notes](#implementation-notes)
- [UI Representation](#ui-representation)

## Problem Statement

A web editor that quickly shares links needs low-friction entry. Is not acceptable that collaborator must create an account to view or start editing. But collaboration still needs identity for cursors, avatars and permissions.

## Solution

[Jazz Auth Modes](https://jazz.tools/docs/auth/authentication#jazz-framework-react)

Support `read-only` user session through Jazz `anonymous`.

- view static shared rooms without creating a local identity secret
- cannot edit or create rooms

Support `guest-editing` user session through Jazz `local-first` mode.

- can opens rcode, creates a room, edits and shares code, without signed up
- start editing without signing up - get generated names and colors
- can upgrade to become registered users while keeping their identity

Support `signed-in` user session through Jazz `external` mode.

- create/has a Better Auth account through email OTP
- wants persistent identity across devices.
- can create multiple rooms, CRUD actions

This is a lightweight approach that avoid implementing a full ownership and role-based concept.

## App API Boundary

rcode uses Jazz for product data sync and permissions, but Better Auth still needs an app-owned HTTP server.

`apps/api` exists for server-only auth infrastructure:

- Better Auth sign-in, sign-up, sign-out, and session endpoints.
- Better Auth JWT/JWKS endpoints used by Jazz external auth.
- Jazz adapter access to Better Auth tables.
- Local-first identity proof verification during account upgrade.

`apps/api` does not own room data workflows. Room creation, room metadata updates, room participant rows, and Yjs update rows use Jazz client writes guarded by Jazz permissions.

This keeps the boundary clear:

- API server: account/session/JWT infrastructure.
- Jazz sync: product data storage, sync, and authorization.
- Web app: user interface and Jazz client mutations.

## User Journeys

### Read-only viewer

A read-only viewer opens a shared link and can view persisted room content without creating an account.

- Uses Jazz `anonymous` mode.
- Cannot edit or create rooms.
- Does not create a durable app profile.
- Does not receive a local-first recovery phrase.

### Guest editor

A guest editor starts with Jazz `local-first` auth.

- Can create rooms.
- Can edit rooms.
- Can share live links.
- Gets a stable Jazz identity stored in browser storage.
- Loses that identity if browser storage is cleared unless they back it up or upgrade.
- Can upgrade to a Better Auth account while keeping the same Jazz user id.

### Signed-in user

A signed-in user uses Better Auth with Jazz external JWT auth.

- Can create, edit, and share rooms.
- Can access their identity across devices.
- Can manage their account.
- Uses the same Jazz user id if upgraded from local-first auth.

## Identity Model

rcode has one app-facing identity id: Jazz `session.user_id`.
In the app schema, columns that store this value should use the name `session_user_id` or a contextual variant like `creator_session_user_id`.

That id can come from either auth mode:

- `local-first`: Jazz derives `session.user_id` from the browser-held local-first secret.
- `external`: Better Auth issues a JWT whose `sub` claim becomes Jazz `session.user_id`.

The intended upgrade path keeps the same id:

1. A guest opens rcode and receives a local-first Jazz identity.
2. rcode creates an app profile with `profiles.session_user_id = session.user_id`.
3. The guest creates rooms and edits as that id.
4. The guest signs up through Better Auth.
5. Better Auth stores the proven Jazz id as the user id.
6. Issued JWTs use that same id as `sub`.
7. Existing rooms, participants, Yjs update metadata, and profile rows continue to point to the same id.

A user can also sign up without creating a room. In that path, Better Auth creates the account and rcode creates the app profile lazily when the authenticated Jazz session is used.

## Schema Responsibilities

Better Auth tables are auth/account infrastructure:

- account identity rows
- email and verification state
- sessions
- linked provider accounts
- JWT signing keys

rcode `profiles` are durable product identity:

- display name in rooms
- avatar shown in collaboration UI
- cursor color

rcode should use `profiles` for product surfaces and use Better Auth tables only for auth/account workflows.

Guest, account, and read-only status should be derived from Jazz auth mode and Better Auth session state rather than stored on profile rows.

Room ownership, participants, and Yjs update metadata should store Jazz session user ids as strings rather than refs to `better_auth_user`, because local-first users can exist without a Better Auth user row.

Use these names for app-owned identity columns:

- `profiles.session_user_id`
- `rooms.creator_session_user_id`
- `roomParticipants.session_user_id`
- `roomYjsUpdates.session_user_id`
- `roomYjsSnapshots.session_user_id`

This keeps the source of the value explicit and avoids confusing Jazz session identity with Better Auth account rows or profile row ids.

## Implementation Notes

Static shared routes should run inside an anonymous Jazz provider/config so reads happen without a browser-held local-first secret.

Editable routes should run inside the normal auth provider that resolves to:

1. Better Auth JWT when a Better Auth session exists.
2. Local-first secret when no Better Auth session exists.

This preserves the separation between read-only viewers and guest editors. A static route rendered through the normal local-first provider would still be read-only by UI convention, but it would not match the intended anonymous auth mode.

---

## UI Representation

| Intent  | Method     | Meaning                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------- |
| Sign in | Email      | Access an existing Better Auth-linked Jazz identity                         |
| Sign in | Passphrase | Restore local-first Jazz identity                                           |
| Sign up | Email      | Create/upgrade the active local-first identity to Better Auth               |
| Sign up | Passphrase | Use the active/generated local-first identity and expose its recovery phras |

**Sign up with email**

1.  User chooses Sign Up
2.  User chooses Email
3.  User enters display name and email
4.  App ensures a local-first Jazz identity exists
5.  App generates local-first identity proof
6.  App starts Better Auth Email OTP sign-up
7.  User enters OTP or the OTP auto-submits when complete
8.  Server verifies proof
9.  Better Auth user is created with the Jazz user ID
10. Jazz reconnects using Better Auth JWT
    This preserves local-first identity and gives email-based access from other devices.

**Sign in with email**

1. User chooses Sign In
2. User chooses Email
3. User enters email
4. API verifies that a Better Auth user exists for that email
5. If no account exists, UI shows a short message and redirects to `/sign-up` with the email prefilled
6. Better Auth sends OTP for existing accounts
7. User enters OTP or the OTP auto-submits when complete
8. Client gets Better Auth JWT
9. Jazz runs with jwtToken

No local-first proof is needed for normal sign-in, because the Better Auth user already maps to the Jazz user ID.

OTP resend calls Better Auth again and follows the Better Auth default OTP behavior.

**Sign up with passphrase**

This is local-first only.

- “Use this device right away”
- “Save this phrase to access the same identity elsewhere”
- “You can add email access later”

- “Add email sign-in later without losing this identity”

**Sign in with passphrase**

This restores the Jazz secret.

- “Paste your recovery phrase”
- not “password”
- not “passphrase password”
- malformed recovery phrases show an invalid recovery phrase message
- valid recovery phrases without a matching rcode profile show that no rcode profile was found for the passphrase
