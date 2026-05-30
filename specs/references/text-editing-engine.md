## Problem statement

A web code editor needs low-latency editing, conflict handling, syntax highlighting, language and keyboard support.

How to handle collaboration:

- Alice and Bob both start with an empty document
- Alice inserts `abc` at position `0`.
- Bob inserts `yxz` at position `0`.
- Without a CRDT engine, the server treat both operations as "insert at index 0" against different document versions.
- Jazz model is Last-Write-Win (LWW), one user may see `abcxyz`, the other may see `xyzabc`, or one operation may overwrite incorrectly unless every operation is transformed against every other concurrent operation. Hi to Yjs.

## Solution

Jazz provides data persistence, sync, access control and user identity.
Yjs provides text CRDT semantics and a maintained Monaco integration through `y-monaco`.

- Monaco as UI editor
- Shiki-to-Monaco highlighting
- TypeScript compiler config
- `y-monaco` bindings to bridge Monaco model and Yjs

With Yjs, Alice’s abc and Bob’s xyz become CRDT operations with stable internal ordering. Instead of both clients arguing about mutable index 0, Yjs gives inserts identities and merges concurrent edits deterministically. Both users converge to the same document, even if they receive operations in different orders.

## Consequences

- Text merge behavior follows Yjs, not a custom Jazz text model.
- Monaco integration can use established Yjs bindings instead of custom editor adapters.
- Jazz schemas store and synchronize persisted Yjs state, metadata, access rows, and presence transport rows.
