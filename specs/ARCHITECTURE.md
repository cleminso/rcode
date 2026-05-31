## Why the architecture is split

The editor state is split because each state type has different requirements.

Yjs text updates need CRDT semantics. They must support concurrent edits, offline work, duplicate delivery, and convergence.

Room metadata does not need text CRDT behavior. Fields like title, language, deletion state, and share identifiers should stay as Jazz data so they are easy to query and authorize.

Presence should not be part of document history. Cursor position, selection, display name, color, and active state are session state. They should be mutable and disposable.

Jazz stores and syncs these pieces, but each piece keeps its own model:

- Yjs updates: append-only Jazz rows.
- Yjs checkpoints: Jazz rows for materialization and compaction.
- Room metadata: Jazz objects.
- Sharing links and relationships: Jazz objects.
- Presence: mutable Jazz rows bridged into Yjs awareness.

## Technology stack

- pnpm workspace for package management.
- Vite for the web build.
- React for the UI.
- TanStack Router for routing and route loaders.
- Jazz for auth, sync, permissions, and local-first data persistence.
- Hono for HTTP routes that need a server boundary.
- shadcn/ui, base/ui, and tailwind/css for UI primitives and styling.
- Monaco for code editing.
- Yjs for collaborative text state.
- `y-monaco` for Monaco/Yjs binding and cursor decorations.

## System architecture

```mermaid
graph TD
    App[React app + TanStack Router] --> Jazz[Jazz app state]
    App --> Monaco[Monaco editor]

    Monaco --> Binding[y-monaco]
    Binding --> YText[Y.Text monaco]
    YText --> YDoc[Y.Doc]

    YDoc --> Provider[Jazz Yjs provider]
    Provider --> Updates[Yjs update rows]
    Provider --> Checkpoints[Yjs checkpoint rows]

    Jazz --> Rooms[room metadata]
    Jazz --> Links[sharing links]
    Jazz --> Relationships[relationships]
    Jazz --> Presence[presence rows]

    Presence --> Awareness[Yjs awareness]
    Awareness --> Binding
```

## Concepts at Play

### Dual Auth Strategy

The app implements Jazz's recommended dual-auth pattern:

- **Local-first**: Users can start immediately without signing up. Their identity is a device secret.
- **External JWT**: When users log in via Better Auth, the app switches to JWT mode while preserving the same identity (or upgrading from local-first).

### Backend-as-Auth-Database

By using `jazzAdapter`, Jazz serves double duty: it's both the application database (rooms, presence) and the auth database (users, sessions). The `permissions.ts` file ensures auth tables remain server-only.

### Provider Remounting on Auth Change

The `key={authKey}` on `JazzProvider` is intentional and required. Jazz clients are bound to a single principal. When a user logs in or out, the entire React subtree must remount to create a fresh Jazz client with the new identity.

### Cookie + JWT Hybrid

Better Auth uses HTTP-only cookies for session security, but Jazz needs a bearer JWT for sync authentication. The `jwtClient` plugin bridges this: the browser sends the cookie to the server, and the server returns a short-lived JWT that the browser passes to Jazz.
