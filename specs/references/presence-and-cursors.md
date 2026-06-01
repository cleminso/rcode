# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Awareness State](#awareness-state)
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

## Schema Decision

Use:

- `roomParticipants` for durable joined-room history
- Yjs Awareness for visible live presence

## Consequences

- Cursor and selection state disappears when a client disconnects.
- Reconnected clients publish fresh Awareness state.
- The dashboard cannot rely on durable presence rows for active-user counts.
- Persisted presence can be added only if product requirements need offline or audit-oriented presence records.
