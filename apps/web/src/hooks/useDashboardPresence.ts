import { useEffect, useRef, useState } from "react";

// These types mirror the server-side interfaces in awarenessServer.ts.
// They are the wire format deserialized from the /api/presence/stream SSE events.
// Exported so useRoomPresence can reuse them without duplicating the shape.
export interface PresenceUserSummary {
  displayName: string;
  picture?: string;
  sessionUserId: string;
}

export interface PresenceRoomSummary {
  roomId: string;
  userCount: number;
  users: PresenceUserSummary[];
}

export interface PresenceSummary {
  rooms: PresenceRoomSummary[];
  timestamp: number;
}

interface DashboardPresence {
  activeRoomIds: Set<string>;
  usersByRoomId: Map<string, PresenceUserSummary[]>;
}

// Shared between useDashboardPresence (multi-room) and useRoomPresence
// (single-room). Centralized here so both hooks build the same SSE URL.
export function getPresenceStreamUrl(roomIds: readonly string[]) {
  const baseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? window.location.origin;
  const url = new URL("/api/presence/stream", baseUrl);

  for (const roomId of roomIds) {
    url.searchParams.append("room", roomId);
  }

  return url.toString();
}

const emptyPresence: DashboardPresence = {
  activeRoomIds: new Set(),
  usersByRoomId: new Map(),
};

function toDashboardPresence(summary: PresenceSummary): DashboardPresence {
  const activeRoomIds = new Set<string>();
  const usersByRoomId = new Map<string, PresenceUserSummary[]>();

  for (const room of summary.rooms) {
    activeRoomIds.add(room.roomId);
    usersByRoomId.set(room.roomId, room.users);
  }

  return { activeRoomIds, usersByRoomId };
}

function getPresenceKey(summary: PresenceSummary) {
  return summary.rooms
    .map((room) => `${room.roomId}:${room.userCount}:${room.users.map((user) => `${user.sessionUserId}:${user.displayName}:${user.picture ?? ""}`).join(",")}`)
    .join("\n");
}

export function useDashboardPresence(roomIds: readonly string[]) {
  const [presence, setPresence] = useState<DashboardPresence>({
    activeRoomIds: new Set(),
    usersByRoomId: new Map(),
  });
  const lastPresenceKeyRef = useRef("");
  const roomIdsKey = roomIds.join("\n");

  useEffect(() => {
    const requestedRoomIds = roomIdsKey === "" ? [] : roomIdsKey.split("\n");

    if (requestedRoomIds.length === 0) {
      lastPresenceKeyRef.current = "";
      setPresence(emptyPresence);
      return;
    }

    const eventSource = new EventSource(getPresenceStreamUrl(requestedRoomIds), {
      withCredentials: true,
    });

    const handlePresence = (event: MessageEvent<string>) => {
      let summary: PresenceSummary;

      try {
        summary = JSON.parse(event.data) as PresenceSummary;
      } catch (error) {
        console.error("Failed to parse dashboard presence summary.", error);
        return;
      }

      const presenceKey = getPresenceKey(summary);
      if (lastPresenceKeyRef.current === presenceKey) {
        return;
      }

      lastPresenceKeyRef.current = presenceKey;
      setPresence(toDashboardPresence(summary));
    };

    eventSource.addEventListener("presence", handlePresence);

    return () => {
      eventSource.removeEventListener("presence", handlePresence);
      eventSource.close();
    };
  }, [roomIdsKey]);

  return presence;
}
