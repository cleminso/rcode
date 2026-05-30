## Overview path

1. Define Jazz schema for entities and relationships.
2. Setup Jazz client and server.
3. Scaffold App routing routing (live and static).
4. Add auth setup.
5. Build room creation with a writable Jazz account.
6. Implement Jazz Yjs provider.
7. Bind `ydoc.getText("monaco")` to Monaco with `y-monaco`.
8. Append local Yjs updates to Jazz.
9. Apply remote Jazz updates to the local `Y.Doc`.
10. to be continued...

## Room creation

- Create a room group.
- Create `codeRoom` metadata.
- Create an empty Yjs document.
- Encode the seed state as a snapshot or `room.ydoc`.
- Create live and optional static link records.

```typescript
const doc = new Y.Doc();
const seedUpdate = Y.encodeStateAsUpdate(doc);

await createCodeRoom({
  title,
  ydoc: seedUpdate,
  createdBy: account.id,
});
```

## Provider integration

- Load latest snapshot.
- Load append-only updates after the snapshot.
- Apply both to the local `Y.Doc`.
- Subscribe to local Yjs updates.
- Subscribe to remote Jazz update rows.

```typescript
const doc = new Y.Doc();
const text = doc.getText("monaco");
const provider = new JazzYjsProvider({ roomId, doc, clientId });

await provider.connect();
bindMonacoToYText(editor, text, provider.awareness);
```

## Presence

- Create a `roomPresence` row when the editor opens.
- Update the same row as cursor and selection change.
- Mirror remote rows into Yjs awareness for `y-monaco`.
- Mark the row closed when the editor closes when possible.

## Sharing

- Implement `/{slug}` redirect to `/rooms/{slug}`.
- Resolve `/rooms/{slug}` to room metadata and link relationship.
- Implement `/s/{staticSlug}` as read-only latest-content rendering.
- Keep reserved routes out of the live slug namespace.

## Auth

- Use Jazz local-first auth for guests, not read-only anonymous accounts.
- Add Better Auth through external JWT or an adapter for upgraded accounts.
- Preserve Jazz user id through local-first proof during upgrade.
- Keep dashboard access separate from link-based room entry.

## Validation

Prefer black-box integration coverage:

- two clients edit the same room and converge
- live link join grants writable relationship
- static link renders latest persisted content read-only
- presence appears and disappears without persisting to Yjs updates
- guest upgrade keeps room access
