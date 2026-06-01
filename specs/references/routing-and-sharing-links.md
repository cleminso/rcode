# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Document Loading](#document-loading)
- [Consequences](#consequences)

## Problem Statement

To collaborate on a document, users need to join a room through a shared link.

The internal system uses `room.id` to identify a room. User-facing URLs should be short and stable. Using `room.id` in URLs would expose internal identifiers and produce less readable links.

Two scenarios:

1. share code for collaboration
2. share code without inviting someone into the room in read-only mode

## Solution

Separate identities:

- Internal sync identity: `rooms.id`
- Live URL identity: `rooms.shareToken`
- Static URL identity: `rooms.staticToken`

Routes:

- Static route: `/s/$staticToken` opens a read-only view of the room and creates an `anonymous` user session.
- Live route: `/$shareToken` opens the live collaborative editor and grants edit access according to room policy.

## Document Loading

The live route loads the room `Y.Doc` through the Jazz Yjs provider:

- apply a selected `roomYjsSnapshots` row if available
- apply `roomYjsUpdates` rows
- subscribe to additional update rows
- bind Monaco through `y-monaco`

The static route reconstructs read-only content from the same Yjs persistence:

- create a scratch `Y.Doc`
- apply a selected snapshot if available
- apply room update rows
- render `doc.getText("monaco").toJSON()`

## Consequences

- Anyone with the share token can edit the room according to live route access policy.
- Anyone with the static token can view rendered content but cannot edit through the static route.
- Static links reflect persisted Yjs state reconstructed from snapshots and updates.
- Static links do not preserve historical content by themselves.
