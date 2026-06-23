## Introduction

> How to improve room loading performance for a fast, "instant" experience?

Our stack:

- Routing via TanStack Router; each `RoomListItem` is a `Link` to `/rooms/$shareToken`.
- Data loading: the dashboard loads room rows and metadata through Jazz (`useAll`, `db.subscribeAll`).
- Jazz API: `db.subscribeAll(query, callback, options?)` returns an unsubscribe function.

When opening a room, the expensive part is loading the Yjs document data from `roomYjsSnapshots` and `roomYjsUpdates`. Once that data is in the local Jazz replica, applying it to a `Y.Doc` is fast.

### Challenges

- `useJazzYjsDocument` was applying Yjs updates **one-by-one**, which is slow when a room has hundreds of updates.
- Without prefetch, the room route only starts subscribing to snapshots/updates after navigation, so the user waits for the network/local sync round-trip.

## Solutions

1. **Batch Yjs updates** through `Y.mergeUpdates` in `useJazzYjsDocument`. Merging `n` updates and applying the result once is faster than `n` separate `Y.applyUpdate` calls.
2. **Prefetch room Yjs data** by subscribing to `roomYjsSnapshots` and `roomYjsUpdates` while the user hovers or focuses a row. The subscription is cancelled on mouse leave/blur (with a short grace period) or on unmount. This logic lives in `usePrefetchRoom`.
3. **TanStack Router preload**: set `defaultPreload: "intent"` on the router so route JS chunks are prefetched on hover/focus. This pairs with the Jazz subscription prefetch but does **not** fetch Jazz data itself, because the room route has no loader.

## Architecture

```
RoomListItem (per visible row)
├── TanStack Router <Link>            # preloads route chunk on hover/focus via defaultPreload: "intent"
└── usePrefetchRoom()                 # subscribes to roomYjsSnapshots + roomYjsUpdates on hover/focus/selection
         │
         ▼
    Jazz local replica               # data is warm before navigation
         │
         ▼
RoomProvider / useJazzYjsDocument    # reads local rows, applies merged update, ready in milliseconds
```

## Implementation notes

- `usePrefetchRoom` is idempotent: calling `prefetch` for a room that is already subscribed is a no-op.
- `{ tier: "local" }` returns whatever is already in the local replica immediately, without waiting for an edge round-trip.
- Cancellation uses a 300 ms grace period. The cursor often leaves the row a few milliseconds before the click (especially with virtual-list recycling or fast mouse paths), so keeping the subscription alive briefly lets the data arrive before navigation unmounts the item.
- On large screens the list can show 40+ rooms, but it is virtualized (`@tanstack/react-virtual`). Only visible rows + overscan mount `RoomListItem`, so the number of active prefetch subscriptions is bounded by the viewport, not the total room count.

## Verify prefetch works

Expected log sequence when hovering a room that has not been opened yet (clear site data first):

1. `[room-prefetch] start` fires when the subscription opens.
2. `[room-prefetch] rows received` fires when Jazz pushes the first batch of snapshots and updates into the local replica.
3. `[room-prefetch] cancelled` fires when the row is no longer hovered/focused/selected or when the component unmounts.

### Manual test

1. Open the dashboard.
2. Hover a room you have never opened.
3. Check the console: spot `[room-prefetch] start` followed by `[room-prefetch] rows received`.
4. Click the room.
5. Verify `rows received` appears before `cancelled` for the clicked room.
6. The room should now load from the already-warmed local replica.

### Keep

These three logs fire at most once per table per room thanks to `loggedTablesRef`, so they do not spam on every local update:

- `[room-prefetch] start` — confirms user intent (hover/focus/selection) actually triggers a subscription.
- `[room-prefetch] rows received` — confirms data arrived and measures latency from intent to local replica.
- `[room-prefetch] cancelled` — confirms cleanup timing and helps detect cancellation-before-data races.
