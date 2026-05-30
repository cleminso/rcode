## Problem Statement

To collaborate on a document, users need to join a room via a shared link.
The intern system use UUIDs to identity a room. Sharing links to users URLs must be short and stable. If we use `room.id` in URls, links would be ugly and expose internal identifiers.

Two scenarios:

1. share code links to someone for collaboration
2. share code without inviting someone into the room (read-only mode)

## Solution

Separates identity:

- Internal sync identity: `room.id`
- Live URL identity: `room.liveShareId`
- Static URL identity: `room.staticShareId`

Separate static links:

- Static route: `/s/$staticShareId` - open a read-only view of the room and create `anonymous` user session.
- Live route: `/$liveShareId` - open the live collaborative editor and grants edit access to the user.

## Consequences

- Anyone with the live share ID can edit the room.
- Anyone with the static share ID can view rendered content but cannot edit through that route.
- Static links reflect the persisted Yjs state available to the read-only route.
- Static links do not preserve historical content by themselves.
