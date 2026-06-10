# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Data Sources](#data-sources)
- [Live Presence Flow](#live-presence-flow)
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

Live active users are not derived from durable rows. Cursor-level activity belongs to Yjs Awareness while a room is open. The dashboard consumes an API presence stream that summarizes Awareness by room.

## Data Sources

- `rooms`: protected room identity, creator identity, and sharing tokens
- `roomMetadata`: participant-editable title and editor language
- `roomParticipants`: joined-room history and `lastAccessedAt`
- `roomYjsUpdates`: document activity metadata if activity summaries are needed
- `profiles`: display names and avatars
- `/api/presence/stream`: live room activity summary derived from in-memory Awareness state

## Live Presence Flow

1. The dashboard loads visible rooms from Jazz: created rooms plus rooms with a `roomParticipants` row for the current session user.
2. `RoomList` passes those visible room ids to `useDashboardPresence`.
3. `useDashboardPresence` opens an `EventSource` connection to `/api/presence/stream` with one `room` query parameter per visible room.
4. The API subscribes that stream to the requested room ids only.
5. The API sends `presence` events containing active room ids and distinct active user counts.
6. `RoomList` stores the streamed summary in React state and uses it to enable/filter the `Active` view.

The dashboard does not receive cursor payloads. It only receives room-level summary data.

## Consequences

- Dashboard can show created rooms and joined rooms.
- Dashboard active state is reliable only while the API Awareness server has connected room clients.
- Document activity can be summarized from update metadata, but human-readable edit history requires reconstruction or derived diffs.
