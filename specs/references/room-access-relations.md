# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Tables](#tables)
- [Live and Static Access](#live-and-static-access)
- [Consequences](#consequences)

## Problem Statement

A collaborative room needs to answer:

- Who can read this room?
- Who can write?
- Who has joined this room?
- Can access be revoked?

Live cursor presence is a separate concern handled by Yjs Awareness.

## Solution

Use a simple relation around room ownership and participation. Per-room roles are out of scope.

Participants have edit capability rather than separate viewer/commenter/editor roles.

## Tables

- `rooms`: protected room identity, creator identity, and sharing tokens
- `roomMetadata`: participant-editable title and editor language
- `roomParticipants`: durable room membership/access history
- `profiles`: display identity for collaboration UI

Awareness is ephemeral and does not need durable rows.

## Live and Static Access

Live route behavior:

- loads a room by `shareToken`
- creates or reads a participant relationship as needed
- loads the room `Y.Doc`
- connects the Jazz Yjs provider
- allows writes according to room access policy

Static route behavior:

- loads a room by `staticToken`
- reconstructs text from Yjs snapshots and update rows
- does not connect an editable provider
- does not write document updates

The same room data supports live and static access. The route decides whether editing is allowed.

## Consequences

- Access checks stay simple: creator, participant, and admin claim.
- Participants can edit rather than requiring per-room role checks.
- Direct invite or shared-link workflows can create participant records.
- Revocation semantics remain a separate product decision.
