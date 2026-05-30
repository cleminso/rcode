## Problem Statement

Room metadata can change when users collaborate:

- Alice changes language from Markdown to Text.
- Bob renames the room.
- Alice renames it too.
- What document am I in?
- What URL do I share to collaborate with others?

## Solution

Stores metadata in Jazz `rooms` row

- `title`
- `editorLanguage`

Metadata are simply row mutation handled by Jazz.
Jazz subscribes to `setEditorLanguage` and `setRoomTitle` queries, sends them upstream. Server evaluates the queries against its own current relation state, finds the matching rows and sends them back. The client only sees rows it has asked for. LWW apply here.

---

## Deleting and Hiding Room

Rooms need lifecycle controls:

- Creator deletes a room.
- A participant hides a room from their dashboard.
- Other open clients need to react to deletion.

Without lifecycle state, deleted rooms may continue to appear or remain editable in stale clients.
What's happens when a room creator deletes a room while Bob is editing? Bob get forced-disconnected?
