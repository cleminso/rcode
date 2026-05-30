## Problem Statement

A collaborative room needs to answer:

- Who can read this room?
- Who can write?
- Who has joined before?
- Who is connected right now?
- Can access be revoked?

## Solution

Instead, we adopt a relation around room ownership and participation to express members present in the live room. There is no per-room roles in scope.

Use relational tables:

- `roomParticipants`: durable room membership/access history
- `roomConnections`: real-time room connections

## Consequences

- Access check is simple, creator, participant and admin claim.
- Participants have edit capability rather than separate role (view/commenter/editor).
- Direct invite workflow allows participants to be invited to the room by the creator and directly start editing.
- Room creator can't revoke participants room access.
