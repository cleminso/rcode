# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Awareness State](#awareness-state)
- [Transport](#transport)
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

Awareness is transported through an app-level WebSocket endpoint. The endpoint fans out binary Yjs
Awareness updates between active clients in the same room.

The transport does not persist Awareness payloads. Jazz remains responsible for durable room data,
room participant history, and Yjs document update rows.

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

To assigns colors differently, look at currently assigned Awareness user colors and chooses from a shared color list.

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

Do not add Jazz tables for cursor positions, selections, or Awareness payloads.

## Consequences

- Cursor and selection state disappears when a client disconnects.
- Reconnected clients publish fresh Awareness state.
- The dashboard cannot rely on durable presence rows for active-user counts.
- Persisted presence can be added only if product requirements need offline or audit-oriented presence records.
