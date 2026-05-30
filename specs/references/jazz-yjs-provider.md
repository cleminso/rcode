## Problem Statement

Jazz sync is row-batch and query-scoped. Yjs doesn't care where updates are stored. But jazz needs to understand when Yjs communicate changes and react to them.

## Solution

Create a Yjs provider that connects a `Y.Doc` to a persistence and sync layer (Jazz). The rest of the editor experience stay standard:

- Monaco still edits a Monaco model.
- `y-monaco` still binds that model to `Y.Text`.
- Yjs still produces and applies binary updates.
- Jazz stores, syncs, authorizes, and persists those updates.

This keeps the editor portable and avoids coupling Monaco directly to Jazz.

We use Yjs as:

- CRDT text engine
- Monaco editor bindingds with `y-monaco`
- Users awareness for cursors and selections

## Challenges

- What happens when the same user opens two browser tabs? Each tab gets its own Yjs clientID. If the provider filters by clientId, one tab ignores the other. This is a real convergence bug, not just an integration detail.

- What happens when a provider reconnects after a network partition? Does it load all history? Does it miss updates? The current doc has no section on reconnection.

- What happens when updates arrive out of order? Jazz v2 is eventually consistent.

## Awareness CRDT

[Yjs source](https://docs.yjs.dev/getting-started/adding-awareness) [API](https://docs.yjs.dev/api/about-awareness)

- how retrieve the Awareness state from the network provider?
- how to set properties that are propagated to all users?
- how to define the `user` property to set the name and color?
  - use `cursor` field to communicate user cursor position and selection in the editor
  - use `user` field to render the cursor object in a unique color with the user name above the cursor

## Awareness Protocol

[Awareness Protocol API](https://docs.yjs.dev/api/about-awareness#awareness-protocol)

It allows to use the Awareness CRDT to propagate presence and Awareness information.
