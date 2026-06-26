# Real-Time Transport Issue

## Problem

When the same room is open in two browsers, typing in Browser A is slow to appear in Browser B.

The first character can appear relatively quickly, but subsequent characters often arrive in delayed batches.

## Current Architecture

The editor uses Jazz as both durable storage and the live transport for Yjs updates.

### Editor Sync Path

1. A Monaco edit mutates the local Yjs text.
2. Yjs emits an update.
3. `useJazzYjsDocument.persistUpdate()` inserts the update as a new Jazz row in `roomYjsUpdates`.
4. The insert waits for `tier: "local"`.
5. Browser B receives matching `roomYjsUpdates` rows through `useAll(app.roomYjsUpdates.where({ room_id }))`.
6. Browser B applies each unapplied remote row with `Y.applyUpdate(...)`.

This means the live path currently has:

- one Jazz insert per Yjs update
- one `roomYjsUpdates` row per Yjs update
- one growing append-only query per room
- one `useAll(app.roomYjsUpdates.where({ room_id }))` subscription per room
- one loop over the full returned row set, skipping already applied rows

Snapshots exist, but they are not the live transport. They reduce bootstrap/replay cost and provide compaction points, while `roomYjsUpdates` remains the append-only live update log.

### Intended Role Split

Jazz is a good fit for:

- room metadata
- permissions
- snapshots
- durable save state
- offline recovery
- compacted update persistence

Yjs connection providers such as `y-websocket` are designed for:

- high-frequency binary updates
- peer broadcast
- low-latency stream semantics
- live collaboration transport without one durable database row per keystroke

## Observed Behavior

Instrumentation was added to `apps/web/src/hooks/useJazzYjsDocument.ts` and `apps/web/src/components/editor/roomProvider.tsx`.

### Browser A

- Yjs updates are observed immediately
- `ensureParticipant()` is fast, usually around `1–14ms`
- Local Jazz persistence with `tier: "local"` is usually around `69–121ms`
- The local `roomYjsUpdates` subscription updates immediately as row counts increase

### Browser B

- Remote rows arrive late and often in batches
- `arrivalDelayMs` has been observed around `3s`, `10s`, and `18–22s`
- `Y.applyUpdate(...)` is fast once rows arrive
- The subscription effect is fast once data arrives, usually around `1–24ms`

### Summary Table

| Browser | Operation                    | Observed range        | Interpretation                                         |
| ------- | ---------------------------- | --------------------- | ------------------------------------------------------ |
| A       | `ensureParticipant()`        | `1–14ms`              | Participant permission check is not the bottleneck.    |
| A       | `wait({ tier: "local" })`    | `69–121ms`            | Local persistence is not the main cross-browser delay. |
| A       | local subscription row count | immediate increments  | Browser A sees its own local writes quickly.           |
| B       | `arrivalDelayMs`             | `3s`, `10s`, `18–22s` | Remote row delivery is delayed.                        |
| B       | `Y.applyUpdate(...)`         | `1–7ms`               | Yjs apply cost is not the bottleneck.                  |
| B       | subscription effect          | `1–24ms`              | React/effect processing is not the bottleneck.         |

## What We Tested

### Added Timing Logs

Added `[yjs-sync]` logs for:

- local update observed
- participant check completed
- local update persisted
- subscription rows changed
- remote update applied
- sync effect completed

Added `[room-sync]` logs for metadata subscription and metadata updates.

## What We Ruled Out

The logs make these unlikely as primary causes:

- Monaco rendering
- local Yjs update generation
- `Y.applyUpdate(...)` cost
- React effect processing
- `ensureParticipant()` latency
- awareness/presence transport
- `tier: "edge"` as the sole cause

The subscription callback itself is also not slow once Browser B receives data.

## Current Diagnosis

The issue is likely one of these two related causes:

1. The append-only `roomYjsUpdates` subscription shape under frequent writes.
2. Jazz remote propagation behavior for that shape.

More specifically, the delayed segment is between Browser A writing `roomYjsUpdates` rows and Browser B receiving those rows through:

`useAll(app.roomYjsUpdates.where({ room_id }))`

Possible bottleneck locations:

- Jazz remote sync upload from Browser A
- Jazz server fanout
- Jazz client subscription/query delivery to Browser B
- backpressure caused by using a growing append-only query as a high-frequency message stream

The current model treats Jazz queries as a realtime pub/sub stream for per-keystroke Yjs updates. The logs suggest this shape does not behave like a low-latency transport.

### Changed appId

Created a new appId with Jazz cloud then everything works as intended.

Guido mention: "sometimes the app get overloaded, and become slow at processing updates. Might be that kind of situation encountered". He suspect a bug with mutations settlements, and sometimes things gets stuck. He is investigating futher.
