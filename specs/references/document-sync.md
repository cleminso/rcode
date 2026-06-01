# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Data Responsibilities](#data-responsibilities)
- [Offline and Reconnect Behavior](#offline-and-reconnect-behavior)
- [Static Read Behavior](#static-read-behavior)
- [Consequences](#consequences)

## Problem Statement

A collaborative editor needs every participant to converge on the same text state across devices, reloads, and offline edits.

Without sync infrastructure:

- User A types locally.
- User B never receives the updates.
- Reloading loses unsaved content.
- Offline edits conflict with remote edits.
- A single mutable text field can lose concurrent edits under LWW semantics.

## Solution

Use Yjs for document convergence and Jazz as the local-first sync transport.

The browser owns a room-scoped `Y.Doc`. The Jazz Yjs provider listens to Yjs update events, stores each binary update in `roomYjsUpdates`, and applies remote update rows back into the `Y.Doc`.

Document content is represented as Yjs updates plus optional checkpoint rows.

## Data Responsibilities

- `rooms`: queryable room metadata and sharing tokens
- `roomParticipants`: durable joined-room history
- `roomYjsUpdates`: canonical Yjs update log
- `roomYjsSnapshots`: checkpoint/cache rows derived from Yjs state
- Yjs Awareness: ephemeral cursors and selections

## Offline and Reconnect Behavior

Yjs document updates are commutative, associative, and idempotent. This means clients can apply updates in different orders and still converge when they receive the same set of updates.

On reconnect, the provider should:

1. keep the local `Y.Doc` state
2. read room update rows visible through Jazz
3. apply missing or repeated updates with `Y.applyUpdate`
4. publish locally generated updates that have not synced

Repeated update application is safe. The provider still tracks origins and provider instance ids to avoid write-back loops.

## Static Read Behavior

A static route reconstructs read-only content from Yjs persistence:

1. create a scratch `Y.Doc`
2. apply a selected `roomYjsSnapshots.state` if available
3. apply `roomYjsUpdates` rows for the room
4. read `doc.getText("monaco").toJSON()`

The static route does not connect an editable provider and does not write document updates.

## Consequences

- Document merge behavior belongs to Yjs, not Jazz column merging.
- Jazz authorizes and syncs rows instead of merging text operations.
- Snapshots improve loading and support restore workflows, but update rows remain canonical.
- Presence is handled by Awareness, not durable room presence rows.
