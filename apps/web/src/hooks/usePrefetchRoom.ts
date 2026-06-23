import { app } from "@rcode/schema";
import { useDb } from "jazz-tools/react";
import { useCallback, useEffect, useRef } from "react";

export function usePrefetchRoom() {
  const db = useDb();

  // Active Jazz subscriptions keyed by roomId. Subscriptions are started on user
  // intent (hover/focus/selection) and shut down when intent is gone or the
  // component unmounts. A Map lets deduplicate starts and cancel individually.
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());

  // Tracks which tables have already logged their first row batch so we don't
  // spam the console on every subsequent local update for the same room.
  const loggedTablesRef = useRef<Map<string, Set<string>>>(new Map());

  // Memoised because the returned functions are consumed inside other
  // components' useEffect dependency arrays. Without useCallback, those effects
  // would rerun on every render of the consumer.
  const prefetch = useCallback((roomId: string, shareToken: string) => {
    // Idempotent: if we already have a live subscription for this room, leave it.
    // Important because the same row can be hovered, focused and
    // keyboard-selected simultaneously.
    if (unsubscribesRef.current.has(roomId) === true) {
      return;
    }

    const prefetchStartedAt = performance.now();

    console.info("[room-prefetch] start", { roomId, shareToken });

    loggedTablesRef.current.set(roomId, new Set());

    // Subscribe to the two Yjs tables that bootstrap the room document. We only
    // need snapshots and updates; the room metadata is already loaded by the
    // dashboard query. { tier: "local" } returns whatever is in the local
    // replica immediately without waiting for an edge round-trip.
    const unsubscribeSnapshots = db.subscribeAll(
      app.roomYjsSnapshots.where({ room_id: roomId }),
      (delta) => {
        if (loggedTablesRef.current.get(roomId)?.has("snapshots") === false) {
          console.info("[room-prefetch] rows received", {
            roomId,
            table: "snapshots",
            rowCount: delta.all.length,
            durationMs: performance.now() - prefetchStartedAt,
          });
          loggedTablesRef.current.get(roomId)?.add("snapshots");
        }
      },
      { tier: "local" },
    );

    const unsubscribeUpdates = db.subscribeAll(
      app.roomYjsUpdates.where({ room_id: roomId }),
      (delta) => {
        if (loggedTablesRef.current.get(roomId)?.has("updates") === false) {
          console.info("[room-prefetch] rows received", {
            roomId,
            table: "updates",
            rowCount: delta.all.length,
            durationMs: performance.now() - prefetchStartedAt,
          });
          loggedTablesRef.current.get(roomId)?.add("updates");
        }
      },
      { tier: "local" },
    );

    unsubscribesRef.current.set(roomId, () => {
      unsubscribeSnapshots();
      unsubscribeUpdates();
      loggedTablesRef.current.delete(roomId);
      console.info("[room-prefetch] cancelled", { roomId, shareToken });
    });
  }, [db]);

  const cancelPrefetch = useCallback((roomId: string) => {
    unsubscribesRef.current.get(roomId)?.();
    unsubscribesRef.current.delete(roomId);
  }, []);

  const cancelAllPrefetches = useCallback(() => {
    for (const unsubscribe of unsubscribesRef.current.values()) {
      unsubscribe();
    }

    unsubscribesRef.current.clear();
    loggedTablesRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cancelAllPrefetches();
    };
  }, [cancelAllPrefetches]);

  return { prefetch, cancelPrefetch, cancelAllPrefetches };
}
