import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPresenceStreamUrl,
  type PresenceRoomSummary,
  type PresenceSummary,
  type PresenceUserSummary,
} from "./useDashboardPresence";

// Extends the wire format with a client-side flag. isLocal is derived from the
// current session, not sent by the server, so the UI can highlight "you".
export interface RoomPresenceUser extends PresenceUserSummary {
  isLocal: boolean;
}

export interface RoomPresence {
  isLoaded: boolean;
  users: RoomPresenceUser[];
}

const emptyPresence: RoomPresence = {
  isLoaded: false,
  users: [],
};

// Internal state before derivation. The raw SSE payload is stored here, then
// toRoomPresence() decorates it with isLocal. Splitting raw vs derived state
// means the EventSource effect only depends on roomId (the only value that
// affects the connection URL), not on sessionUserId.
interface RawRoomPresence {
  isLoaded: boolean;
  room: PresenceRoomSummary | null;
}

const emptyRawPresence: RawRoomPresence = {
  isLoaded: false,
  room: null,
};

// Serializes the room summary into a string key for cheap equality checks.
// If two consecutive SSE events produce the same key, the state update is
// skipped to avoid unnecessary re-renders.
function getRoomPresenceKey(room: PresenceRoomSummary | null) {
  if (room === null) {
    return "";
  }

  return room.users
    .map((user) => `${user.sessionUserId}:${user.displayName}:${user.picture ?? ""}`)
    .join("\n");
}

// Transforms raw SSE data into the consumer-facing RoomPresence by adding
// isLocal. Called via useMemo so sessionUserId changes don't recreate the
// EventSource — they only re-derive isLocal on existing data.
function toRoomPresence(rawPresence: RawRoomPresence, sessionUserId: string | null): RoomPresence {
  if (rawPresence.isLoaded === false) {
    return emptyPresence;
  }

  if (rawPresence.room === null) {
    return {
      isLoaded: true,
      users: [],
    };
  }

  return {
    isLoaded: true,
    users: rawPresence.room.users.map((user) => ({
      ...user,
      isLocal: user.sessionUserId === sessionUserId,
    })),
  };
}

export function useRoomPresence(roomId: string | null, sessionUserId: string | null) {
  const [rawPresence, setRawPresence] = useState<RawRoomPresence>(emptyRawPresence);
  const lastPresenceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (roomId === null) {
      lastPresenceKeyRef.current = null;
      setRawPresence(emptyRawPresence);
      return;
    }

    // Reset dedup state and raw presence when switching rooms so stale data
    // from the previous room doesn't briefly appear.
    lastPresenceKeyRef.current = null;
    setRawPresence(emptyRawPresence);

    const eventSource = new EventSource(getPresenceStreamUrl([roomId]), {
      withCredentials: true,
    });

    const handlePresence = (event: MessageEvent<string>) => {
      let summary: PresenceSummary;

      try {
        summary = JSON.parse(event.data) as PresenceSummary;
      } catch (error) {
        console.error("Failed to parse room presence summary.", error);
        return;
      }

      // The SSE stream may carry multiple rooms (it's shared with the dashboard
      // hook). Filter to the one this hook subscribed to.
      const room = summary.rooms.find((currentRoom) => currentRoom.roomId === roomId) ?? null;
      const presenceKey = getRoomPresenceKey(room);

      if (lastPresenceKeyRef.current === presenceKey) {
        return;
      }

      lastPresenceKeyRef.current = presenceKey;
      setRawPresence({ isLoaded: true, room });
    };

    eventSource.addEventListener("presence", handlePresence);

    return () => {
      eventSource.removeEventListener("presence", handlePresence);
      eventSource.close();
    };
  }, [roomId]);

  return useMemo(() => toRoomPresence(rawPresence, sessionUserId), [rawPresence, sessionUserId]);
}
