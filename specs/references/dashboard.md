# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Data Sources](#data-sources)
- [Consequences](#consequences)

## Problem Statement

Users need a view to visualize their data:

- Which rooms have I created?
- Which rooms have I joined?
- Who else has been there?
- Which rooms have document activity?

Without durable participant records, the dashboard can only show rooms the user owns, not rooms joined through a link.

## Solution

Dashboard access is derived from:

- creator relationship through `rooms.creator_session_user_id`
- non-deleted room participant relationship through `roomParticipants.session_user_id`

Live active users are not derived from durable rows. Cursor-level activity belongs to Yjs Awareness while a room is open.

## Data Sources

- `rooms`: room metadata and creator identity
- `roomParticipants`: joined-room history and `lastAccessedAt`
- `roomYjsUpdates`: document activity metadata if activity summaries are needed
- `profiles`: display names and avatars

## Consequences

- Dashboard can show created rooms and joined rooms.
- Dashboard should not claim reliable active-user presence without an active Awareness channel.
- Document activity can be summarized from update metadata, but human-readable edit history requires reconstruction or derived diffs.
