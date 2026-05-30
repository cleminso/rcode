## Problem Statement

Users need visual awareness of other users' cursor positions and presence in a working document.

- Who is present in the room?
- Where is Bob typing?
- Is Alice selecting a line?

Without presence awareness, users can collide and the room feels visually empty.

## Solution

Use Yjs Awareness for ephemeral presence. The user Awareness state includes:

- `clientId`
- generated or account name
- color
- picture
- `lastActive`

The provider observes Awareness changes and builds a `users` map. Cursor render is delegated to `y-monaco` then we injects CSS variables and labels for each users cursor. Cursor state disappears when user leaves the room.

## About Awareness

- isn't stored in the Yjs document.
- doesn't need to be persisted across sessions.
- use a tiny state-based Awareness CRDT that propagates JSON objects to all users.
- go offline? your Awareness state is automatically deleted and all users are notified that you went offline.
