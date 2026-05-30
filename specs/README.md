## Product description

rcode is a web collaborative code editor. A user creates a code room, shares a live link, and other users can edit with them after opening the link.

The room uses:

- Monaco for editing.
- Yjs for CRDT document state.
- `y-monaco` for Monaco bindings and cursor decorations.
- Jazz for local-first persistence, sharing, access, and identity.

The room model is a single document shared across all room participants.

## Why this setup

A collaborative code editor needs three separate layers:

1. A code editor UI.
2. A text collaboration engine.
3. A persistence, identity, access, and sharing system.

Monaco solves the editor UI. It does not solve multi-user text merging.

Yjs solves collaborative text state. It gives the editor CRDT semantics, handles concurrent edits, deduplicates updates, and lets clients converge without requiring a central text authority.

`y-monaco` solves the binding between Monaco and Yjs. It keeps the Monaco model connected to `Y.Text` and uses Yjs awareness for collaborative cursor and selection rendering.

Jazz solves the application backend concerns around the collaborative document:

- local-first persistence
- sync
- access control
- sharing links
- room metadata
- identity
- guest-to-account upgrade paths

## Core choices

- Keep one Yjs document per room.
- Use `ydoc.getText("monaco")` as the shared text contract.
- Build a Jazz Yjs provider.
- Store Yjs updates as append-only Jazz rows.
- Store Yjs checkpoints for faster materialization.
- Store room metadata separately from Yjs text state.
- Store presence in one mutable `roomPresence` row per open editor session.
- Bridge Jazz presence rows into Yjs awareness for `y-monaco`.
- Use relationship-based access instead of viewer/editor roles.

## How it works

The editor opens with a room-scoped `Y.Doc`.

The Jazz Yjs provider materializes that document by loading the latest checkpoint and applying append-only updates after it. Local Yjs updates are appended to Jazz. Remote Jazz update rows are observed and applied back into the local `Y.Doc`.

Monaco does not read or write Jazz directly. Monaco binds to `ydoc.getText("monaco")` through `y-monaco`.

Room metadata, such as title and language, is stored as Jazz data outside the Yjs document. This keeps the text CRDT focused on source content and keeps product metadata queryable.

Presence is not durable document history. Each open editor session writes mutable presence state, and the app mirrors remote presence into Yjs awareness so `y-monaco` can render cursors and selections.

## User paths

### Create a room

1. Signed-in or local-first guest user creates a room.
2. App creates a Jazz group for the room.
3. App creates room metadata.
4. App creates the initial Yjs checkpoint.
5. Editor connects the Jazz Yjs provider to Monaco.

### Join from a live link

1. User opens `/$liveShareId`.
2. App resolves the live share identifier.
3. The live link is treated as a bearer capability.
4. A signed-in or local-first guest user joins the room as a participant.
5. The provider loads the Yjs checkpoint and append-only updates.
6. Monaco binds to `ydoc.getText("monaco")`.
7. Presence starts for the open editor session.

### Open a static link

1. User opens `/s/$staticShareId`.
2. App resolves the static link to the room.
3. App reads the latest persisted Yjs state.
4. App decodes `doc.getText("monaco")`.
5. App renders read-only content.

## Non-goals

- Multiple files per room.
- Viewer/editor role logic.
- Persisted awareness history.
- Frozen static snapshots.
