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
- `y_client_id`: Yjs runtime client id for debugging and inspection
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

A snapshot is produced from a `Y.Doc` with encoded document state. Applying a snapshot is equivalent to applying a Yjs update that contains the known document state at the checkpoint.

Safe reconstruction rule:

1. apply the selected snapshot
2. apply update rows for the room

Applying an update already represented by the snapshot is safe because Yjs document updates are idempotent.

Snapshot rows make document loading more efficient and support restore workflows, but they do not replace `roomYjsUpdates` as the canonical persistence path.

## Edit History Semantics

`roomYjsUpdates` can support a technical edit history because every row records a Yjs binary update plus metadata.

What this can support:

- inspect update counts per room
- show activity grouped by `session_user_id`
- show broad document activity around checkpoint rows
- reconstruct the document by applying subsets of updates to a scratch `Y.Doc`
- restore from a snapshot by creating a restore operation that resets the document to the selected checkpoint state

What it does not provide by itself:

- human-readable diffs
- semantic operations such as renamed function or deleted paragraph
- reliable undo per author without additional Yjs undo-manager design

Human-readable edit history requires decoding Yjs state into text snapshots or deriving text diffs between reconstructed states.

Restore should not delete update rows. Prefer appending a restore update or creating a new snapshot-derived document state so the history remains auditable.

## Multi-Tab and Echo Handling

Each tab gets its own Yjs `clientID`. Do not filter remote rows by `session_user_id`; the same user may have multiple tabs that should receive each other's updates.

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

- Which client or process is allowed to create snapshot rows?
- What policy selects the snapshot used for bootstrap?
- What pruning policy, if any, removes update rows represented by trusted snapshots?
- How should restore be represented: append a Yjs restore update, fork a room, or replace room content through a controlled document operation?
