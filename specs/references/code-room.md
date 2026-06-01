# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Document Content](#document-content)
- [Deleting and Hiding Room](#deleting-and-hiding-room)

## Problem Statement

Room metadata can change when users collaborate:

- Alice changes language from Markdown to Text.
- Bob renames the room.
- Alice renames it too.
- What document am I in?
- What URL do I share to collaborate with others?

## Solution

Store queryable metadata in the Jazz `rooms` row:

- `shareToken`
- `staticToken`
- `title`
- `editorLanguage`
- `creator_session_user_id`

Metadata mutations are normal Jazz row updates. LWW is acceptable for room title and editor language because they are metadata fields, not collaborative text content.

## Document Content

Do not store collaborative code text directly in `rooms`.

Document content lives in one room-scoped `Y.Doc` using `doc.getText("monaco")`. The durable representation is:

- `roomYjsUpdates` for canonical CRDT updates
- `roomYjsSnapshots` for checkpoint/cache rows

This keeps Yjs responsible for text conflicts and Jazz responsible for row sync and access control.

## Deleting and Hiding Room

Rooms need lifecycle controls:

- Creator deletes a room.
- A participant hides a room from their dashboard.
- Open clients need to react to deletion.

Without lifecycle state, deleted rooms may continue to appear or remain editable in stale clients.

Room deletion behavior for active editors remains a product decision. A deletion flag on `rooms` can prevent new writes while the provider and UI react to the room state.
