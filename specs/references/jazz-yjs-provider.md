# Table of Contents

- [Problem Statement](#problem-statement)
- [Direction](#direction)
- [Persistence Model](#persistence-model)
- [Schema Shape](#schema-shape)
- [Provider Flow](#provider-flow)
- [Provider Runtime Invariants](#provider-runtime-invariants)
- [Snapshot Semantics](#snapshot-semantics)
- [Edit History Semantics](#edit-history-semantics)
- [Multi-Tab and Echo Handling](#multi-tab-and-echo-handling)
- [Awareness](#awareness)
- [Open Questions](#open-questions)

## Problem Statement

Jazz sync is row-batch and query-scoped. Yjs does not care where updates are stored, but the provider needs to connect Yjs binary updates to Jazz rows without turning document content into a LWW text field.

rcode uses one `Y.Doc` per room. Monaco edits a Monaco model, `y-monaco` binds that model to `Y.Text`, and Yjs produces binary updates. Jazz is the storage, sync, authorization, and subscription layer for those updates.

## Direction

Create a Jazz Yjs provider as bridge between Yjs and Jazz.

The provider stores Yjs incremental updates in Jazz rows and treats snapshots as derived checkpoints. This keeps conflict handling inside Yjs and uses Jazz as the local-first transport.

The canonical room document is reconstructed from Yjs update data.

## Persistence Model

Yjs has two useful persistence forms:

- append-only document updates
- encoded document state snapshots

rcode uses both forms with different responsibilities:

- `roomYjsUpdates` is the canonical persistence path for document convergence.
- `roomYjsSnapshots` is an immutable checkpoint/cache derived from a `Y.Doc` state.

Snapshots are stored as checkpoint rows. They help clients bootstrap a `Y.Doc`, while update rows remain the canonical reconstruction path.

## Schema Shape

`roomYjsUpdates` stores every Yjs update row that needs to sync across collaborators.

- `room_id`: reference to `rooms.id`
- `update`: Yjs binary update as bytes
- `session_user_id`: Jazz app identity that produced the row
- `y_client_id`: exact Yjs runtime client id string for debugging and inspection
- `provider_instance_id`: browser/provider instance id for echo handling
- `createdAt`: row creation metadata for inspection and pruning policies

`roomYjsSnapshots` stores checkpoint rows.

- `room_id`: reference to `rooms.id`
- `state`: encoded Yjs document state as bytes
- `stateVector`: optional Yjs state vector for diff and compaction logic
- `session_user_id`: optional producer identity
- `createdAt`: checkpoint metadata

The `rooms` table keeps protected room identity and sharing fields:

- `shareToken`
- `staticToken`
- `creator_session_user_id`

The `roomMetadata` table keeps participant-editable room metadata:

- `room_id`
- `title`
- `editorLanguage`

## Provider Flow

Document bootstrap:

1. Create a `Y.Doc` for the room during React render.
2. Apply a snapshot from `roomYjsSnapshots` if one is selected.
3. Normalize stored Jazz bytes into `Uint8Array` before applying them.
4. Apply `roomYjsUpdates` rows for the room.
5. Mark the room as ready once bootstrap rows have been processed.
6. Bind Monaco to `doc.getText("monaco")` through `y-monaco`.
7. Subscribe to additional `roomYjsUpdates` rows for the room.

Local edit:

1. Monaco mutates the bound `Y.Text`.
2. `Y.Doc` emits an `update` event.
3. The Jazz Yjs provider inserts a `roomYjsUpdates` row.
4. Jazz syncs that row to other subscribed clients.

Remote edit:

1. Jazz delivers a `roomYjsUpdates` row.
2. The provider normalizes `row.update` to `Uint8Array`.
3. The provider applies the row with `Y.applyUpdate(doc, update, provider)`.
4. Yjs merges the update into the document.
5. `y-monaco` updates the Monaco model.

## Provider Runtime Invariants

The provider must preserve these invariants:

- The room `Y.Doc` is created during render, keyed by `roomId`. Do not create an initial doc and replace it from an effect; row application can then target a stale doc while Monaco binds to the replacement.
- Readiness is tracked by ready `roomId`, not only by a boolean. A room switch must synchronously expose `isYjsReady === false` until the new room's rows have been processed.
- Monaco binding waits for both Monaco mount and `isYjsReady === true`. This prevents an empty editor model from seeding the room doc with remote Yjs updates unapplied.
- Monaco binding lives in a dedicated hook so editor setup, room loading, and Yjs binding lifecycles stay separate.
- Sessions without an editable Jazz identity receive a read-only Monaco editor. They can still receive Yjs rows, but local edits are blocked because the provider cannot persist them.
- Remote Jazz rows are applied with a stable remote origin object. The local `ydoc.on("update")` listener ignores that origin so applying remote rows does not write the same update back to Jazz.
- Echo filtering uses `provider_instance_id`, not `session_user_id`. The same user can have multiple browser tabs, and those tabs should still receive each other's updates.
- Applied update ids are tracked per room/provider instance to avoid unnecessary duplicate work. Yjs updates are still idempotent, so this is an optimization and loop guard rather than a correctness requirement.
- Local updates are copied for insertion. Yjs update buffers should be treated as immutable Jazz payloads.
- Share-token collaborators write through `roomParticipants`. The provider calls `ensureParticipant()` as a prerequisite for inserting Yjs rows so permission checks use the same durable path as metadata edits.
- Apply and persist failures are reported as provider errors. The room UI surfaces those errors through toast notifications while the console keeps the raw error for debugging.

## Snapshot Semantics

Snapshots are immutable derived rows, not the canonical document representation.

A snapshot is produced from a `Y.Doc` with `Y.encodeStateAsUpdate(doc)`. Applying a snapshot is equivalent to applying a Yjs update that contains the known document state at the checkpoint.

### Snapshot creation

Any authorized editor client can create snapshot rows. The provider uses a timer-based approach:

- Track local edits via the `ydoc.on("update")` listener.
- Check every 30 seconds whether edits have occurred since the last snapshot.
- If edits exist and 5 minutes have elapsed, create a new snapshot row.
- Multiple clients may create near-identical snapshots simultaneously; bootstrap selects the latest by `createdAt`.

This is analogous to Notion's automatic version history (snapshots every 10 minutes during active editing).

### Safe reconstruction rule

1. Apply the latest snapshot by `createdAt`.
2. Apply **all** visible `roomYjsUpdates` rows for the room.

**Do not filter updates by timestamp.** Timestamp filtering is unsafe in a local-first system: an offline client may create an update before a snapshot exists, then sync it later. A timestamp filter would skip that update even though the snapshot did not include it.

Applying an update already represented by the snapshot is safe because Yjs document updates are idempotent. The snapshot provides a fast baseline; updates fill in anything that arrived after the snapshot was taken.

### Snapshot roles

| Role | Table |
|------|-------|
| Real-time sync | `roomYjsUpdates` — canonical persistence, queried by provider |
| Bootstrap optimization | `roomYjsSnapshots` — latest snapshot + all updates |
| Version history | `roomYjsSnapshots` — user-facing timeline, restore points |

`roomYjsUpdates` is never queried for user-facing history. It is an internal sync mechanism.

## Edit History Semantics

rcode provides **snapshot-based version history**, not keystroke-level edit history.

### What users see

A chronological list of snapshot versions with:
- timestamp
- author (`session_user_id`)
- ability to view that version
- ability to restore the document to that version

### How it works

- `roomYjsSnapshots` stores periodic full-document snapshots.
- The history UI queries `roomYjsSnapshots` ordered by `createdAt`.
- Each snapshot is a Yjs document state that can be loaded into a scratch `Y.Doc` for preview or applied to the live document for restore.

### What it does not provide

- Keystroke-level diffs ("who changed line 42 at 2:15 PM")
- Semantic operations ("renamed function foo to bar")
- Git-style branching or merging

These would require a central operation log and ordered transforms (like Google Docs' OT server), which is incompatible with Jazz's distributed sync model.

### Restore

Restore applies a snapshot's encoded state to the current `Y.Doc` as a new update. This does not delete update rows; it appends a new state so the history timeline remains intact. The restored state becomes a new snapshot in the history.

## Multi-Tab and Echo Handling

Each tab gets its own Yjs `clientID`. Do not filter remote rows by `session_user_id`; the same user may have multiple tabs that should receive each other's updates.

Yjs `clientID` values are unsigned 32-bit integers. Store them as strings in Jazz rows because Jazz integer fields are signed i32 and can reject valid Yjs ids.

Echo handling should be scoped to the provider instance:

- ignore rows created by the same `provider_instance_id` only when they are locally applied
- still apply rows from the same `session_user_id` when they come from a different provider instance
- set transaction origin when applying remote updates so the provider does not write back an update it just applied

Yjs updates are commutative, associative, and idempotent, so duplicate application is safe for document convergence. Echo handling is mainly for avoiding write-back loops and unnecessary work.

## Awareness

Yjs Awareness is ephemeral and is not stored in Jazz tables.

Use Awareness for:

- cursor position
- selections
- user label
- user color

Do not add a durable live-presence table for cursor presence. Durable participation belongs in `roomParticipants`; live cursor state belongs in Yjs Awareness.

## Open Questions

- When should update rows be batched with `Y.mergeUpdates` to reduce row count?
- Should snapshots support user-defined labels (e.g., "Before refactoring") in addition to auto-generated timestamps?
- What retention policy, if any, should govern old snapshot rows?
