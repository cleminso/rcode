import { useEffect, useRef, useState } from "react";

interface PresenceSummary {
  rooms: Array<{ roomId: string; userCount: number }>;
  timestamp: number;
}

interface DashboardPresence {
  activeRoomIds: Set<string>;
  userCountByRoomId: Map<string, number>;
}

function getPresenceStreamUrl(roomIds: readonly string[]) {
  const baseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? window.location.origin;
  const url = new URL("/api/presence/stream", baseUrl);

  for (const roomId of roomIds) {
    url.searchParams.append("room", roomId);
  }

  return url.toString();
}

const emptyPresence: DashboardPresence = {
  activeRoomIds: new Set(),
  userCountByRoomId: new Map(),
};

function toDashboardPresence(summary: PresenceSummary): DashboardPresence {
  const activeRoomIds = new Set<string>();
  const userCountByRoomId = new Map<string, number>();

  for (const room of summary.rooms) {
    activeRoomIds.add(room.roomId);
    userCountByRoomId.set(room.roomId, room.userCount);
  }

  return { activeRoomIds, userCountByRoomId };
}

function getPresenceKey(summary: PresenceSummary) {
  return summary.rooms.map((room) => `${room.roomId}:${room.userCount}`).join("\n");
}

export function useDashboardPresence(roomIds: readonly string[]) {
  const [presence, setPresence] = useState<DashboardPresence>({
    activeRoomIds: new Set(),
    userCountByRoomId: new Map(),
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
