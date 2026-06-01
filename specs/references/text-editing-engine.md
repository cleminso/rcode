# Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Document Storage](#document-storage)
- [Consequences](#consequences)

## Problem Statement

A web code editor needs low-latency editing, conflict handling, syntax highlighting, language support, and keyboard support.

Collaboration example:

- Alice and Bob both start with an empty document.
- Alice inserts `abc` at position `0`.
- Bob inserts `xyz` at position `0`.
- Without a CRDT engine, both operations target mutable index `0` against different document versions.
- If the document text were stored as one Jazz field, LWW could overwrite one edit.

## Solution

Jazz provides data persistence, sync, access control, and user identity. Yjs provides text CRDT semantics and a maintained Monaco integration through `y-monaco`.

Use:

- Monaco as the editor UI
- Shiki-to-Monaco for highlighting
- TypeScript compiler configuration for language support
- `y-monaco` to bridge Monaco model state and `Y.Text`
- Jazz rows to sync Yjs binary updates

With Yjs, Alice's `abc` and Bob's `xyz` become CRDT operations with stable internal identities. Instead of both clients arguing about mutable index `0`, Yjs merges concurrent inserts deterministically. Both users converge to the same document even if they receive updates in different orders.

## Document Storage

One room maps to one `Y.Doc`. The text content is stored in `doc.getText("monaco")`.

The durable schema stores:

- Yjs incremental updates in `roomYjsUpdates`
- optional encoded state checkpoints in `roomYjsSnapshots`
- queryable room metadata in `rooms`

Do not store the collaborative text as a plain Jazz string field.

## Consequences

- Text merge behavior follows Yjs, not a custom Jazz text model.
- Monaco integration can use established Yjs bindings instead of custom editor adapters.
- Jazz schemas store metadata, access rows, Yjs update rows, and checkpoint rows.
- Awareness handles cursors and selections outside the durable document state.
