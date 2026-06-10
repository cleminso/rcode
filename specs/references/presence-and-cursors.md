# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Awareness State](#awareness-state)
- [Transport](#transport)
- [Expected Awareness Flow](#expected-awareness-flow)
- [Dashboard Presence Summary Flow](#dashboard-presence-summary-flow)
- [Cursor Rendering](#cursor-rendering)
- [Lifecycle Notes](#lifecycle-notes)
- [Schema Decision](#schema-decision)
- [Consequences](#consequences)

## Problem Statement

Users need visual awareness of other users' cursor positions and presence in a working document.

- Who is present in the room?
- Where is Bob typing?
- Is Alice selecting a line?

Without presence awareness, users can collide and the room feels visually empty.

## Solution

Use Yjs Awareness for ephemeral presence. The provider propagates Awareness state alongside the room `Y.Doc`.

Cursor rendering is delegated to `y-monaco`; rcode can inject CSS variables and labels for each user's cursor.

## Awareness State

The Awareness state can include:

- Yjs `clientID`
- display name
- color
- avatar
- cursor position
- selection

Awareness state is not stored inside the Yjs document and is not persisted in Jazz tables.

## Transport

Awareness is transported through an app-level WebSocket endpoint at `/api/awareness`.
The endpoint fans out binary Yjs Awareness updates between connected clients in the same room.

The transport does not persist Awareness payloads. Jazz remains responsible for durable room data,
room participant history, and Yjs document update rows.

The API process also exposes a dashboard summary stream at `/api/presence/stream`. This stream is
derived from Awareness state and sends room-level summaries to dashboard clients. It does not expose
cursor payloads or persist live presence rows.

## Expected Awareness Flow

Room editor flow:

1. `RoomProvider` resolves the room, metadata, participant state, and room-scoped `Y.Doc`.
2. `useRoomAwareness` creates a `y-protocols` `Awareness` instance on that same `Y.Doc`.
3. When the Yjs provider is ready and the session has a Jazz user id, the hook reads the local
   `profiles` row for display identity.
4. The hook sets local Awareness state with `user` details:
   - `clientId`: Awareness client id
   - `sessionUserId`: Jazz session user id
   - `displayName`: profile display name or generated fallback
   - `picture`: optional profile avatar
   - `color`: assigned from the shared palette
5. The hook opens a WebSocket to `/api/awareness?room=<roomId>` on the API host.
6. On socket open, the browser sends a full encoded Awareness update for known local state.
7. `y-monaco` writes local cursor and selection changes into Awareness.
8. The hook listens for local Awareness updates, encodes changed client ids, and sends binary
   Awareness updates over the WebSocket.
9. The API Awareness server applies the update to the room's in-memory Awareness instance.
10. The API records which socket owns each Awareness client id, then broadcasts the encoded update
    to other sockets in the same room.
11. Other browsers apply the update with a remote origin so local rebroadcast loops are skipped.
12. `y-monaco` renders remote selections and cursors from the updated Awareness state.

Disconnect flow:

1. On unmount or page hide, the browser removes its local Awareness state.
2. On socket close, the API removes Awareness client ids owned by that socket.
3. The API destroys the in-memory Awareness room when no sockets remain.
4. Cursor and selection state disappears because it was never persisted.

## Dashboard Presence Summary Flow

Dashboard flow:

1. `RoomList` computes the room ids visible to the current user from Jazz rows.
2. `useDashboardPresence(roomIds)` opens an `EventSource` connection to
   `/api/presence/stream?room=<roomId>&room=<roomId>`.
3. The API subscribes that stream to only the requested room ids.
4. The API sends an initial `presence` event with active summaries for requested rooms.
5. When any requested room's Awareness user set changes, the API sends another `presence` event.
6. The browser parses the event, builds `activeRoomIds` and `userCountByRoomId`, and updates React
   state only when the summary changed.
7. The dashboard `Active` filter uses `activeRoomIds` to show only rooms with live Awareness users.

Presence summary counts distinct `user.sessionUserId` values from Awareness state. Multiple browser
tabs for the same Jazz user count as one active user for dashboard purposes.

## Cursor Rendering

`y-monaco` publishes the local Monaco selection into Awareness as `selection` and renders remote
selections as Monaco decorations with these classes:

- `yRemoteSelection`
- `yRemoteSelection-{clientId}`
- `yRemoteSelectionHead`
- `yRemoteSelectionHead-{clientId}`

rcode does not render cursor DOM directly. Instead, it listens to Awareness changes and injects
per-client CSS variables for those `y-monaco` classes.

Cursor colors are assigned from a fixed palette by hashing `session_user_id` and the Yjs Awareness
`clientID`. This keeps colors stable for a browser tab without needing durable color storage.

To assign colors, look at currently assigned Awareness user colors and choose from a shared color list.

When users select overlapping text, `y-monaco` creates one Monaco decoration per remote client.
Monaco paints overlapping decorations according to its decoration rendering order. rcode does not
attempt to merge or arbitrate overlapping selections.

## Lifecycle Notes

Do not set local Awareness state to `null` while preparing the room. `y-protocols` ignores
`setLocalStateField()` when the local state is `null`, and `y-monaco` relies on
`setLocalStateField("selection", ...)` to publish cursor selections.

Initialize or revive local state with `setLocalState({ ...(getLocalState() ?? {}), user })` before
Monaco publishes selections.

## Schema Decision

Use:

- `roomParticipants` for durable joined-room history
- Yjs Awareness for visible live presence
- `/api/presence/stream` for dashboard summaries derived from Awareness

Do not add Jazz tables for cursor positions, selections, or Awareness payloads.

## Consequences

- Cursor and selection state disappears when a client disconnects.
- Reconnected clients publish fresh Awareness state.
- The dashboard active filter relies on the API presence stream, not durable Jazz rows.
- Persisted presence can be added only if product requirements need offline or audit-oriented presence records.
