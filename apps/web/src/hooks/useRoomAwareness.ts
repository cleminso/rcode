import { useSession } from "jazz-tools/react";
import { useEffect, useMemo } from "react";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import type * as Y from "yjs";

interface UseRoomAwarenessArgs {
  isReady: boolean;
  roomId: string | null;
  ydoc: Y.Doc;
}

export interface AwarenessUser {
  clientId: number;
  color: AwarenessColorName;
  displayName: string;
  sessionUserId: string;
}

export interface AwarenessState {
  user?: AwarenessUser;
}

export type AwarenessColorName = (typeof awarenessColorNames)[number];

const awarenessColorNames = ["emerald", "blue", "violet", "amber", "rose", "cyan"] as const;
const remoteAwarenessOrigin = { provider: "rcode-awareness-websocket" };

function getAwarenessSocketUrl(roomId: string) {
  // Awareness connects directly to the API host.
  const baseUrl = new URL(import.meta.env.VITE_AUTH_BASE_URL ?? window.location.origin);
  baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  baseUrl.pathname = "/api/awareness";
  baseUrl.search = "";
  baseUrl.searchParams.set("room", roomId);
  return baseUrl.toString();
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getColorName(sessionUserId: string, clientId: number) {
  const index = hashString(`${sessionUserId}:${clientId}`) % awarenessColorNames.length;
  return awarenessColorNames[index];
}

function getDisplayName(sessionUserId: string) {
  const suffix = sessionUserId.replace(/[^a-zA-Z0-9]/g, "").slice(-6);

  if (suffix === "") {
    return "Guest";
  }

  return `Guest ${suffix}`;
}

function toAwarenessUpdate(data: MessageEvent["data"]) {
  if (data instanceof ArrayBuffer === true) {
    return new Uint8Array(data);
  }

  if (data instanceof Blob === true) {
    return data.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  return null;
}

export function useRoomAwareness(args: UseRoomAwarenessArgs) {
  const { isReady, roomId, ydoc } = args;
  const session = useSession();
  const sessionUserId = session?.user_id ?? null;
  const awareness = useMemo(() => new Awareness(ydoc), [ydoc]);

  useEffect(() => {
    return () => {
      awareness.destroy();
    };
  }, [awareness]);

  useEffect(() => {
    if (isReady === false || roomId === null || sessionUserId === null) {
      return;
    }

    // Do not clear local state before readiness: y-protocols ignores
    // setLocalStateField() when the current state is null, and y-monaco later
    // publishes selection through setLocalStateField("selection", ...).
    awareness.setLocalState({
      ...(awareness.getLocalState() ?? {}),
      user: {
        clientId: awareness.clientID,
        color: getColorName(sessionUserId, awareness.clientID),
        displayName: getDisplayName(sessionUserId),
        sessionUserId,
      } satisfies AwarenessUser,
    });
  }, [awareness, isReady, roomId, sessionUserId]);

  useEffect(() => {
    if (isReady === false || roomId === null || sessionUserId === null) {
      return;
    }

    const socketUrl = getAwarenessSocketUrl(roomId);
    const websocket = new WebSocket(socketUrl);
    websocket.binaryType = "arraybuffer";

    const sendUpdate = (update: Uint8Array) => {
      if (websocket.readyState !== WebSocket.OPEN) {
        return;
      }

      const payload = new ArrayBuffer(update.byteLength);
      new Uint8Array(payload).set(update);
      websocket.send(payload);
    };

    const broadcastFullState = () => {
      // Send every known state on connect so the server can share this client's
      // live user/selection state with peers that join later.
      const clients = Array.from(awareness.getStates().keys());
      sendUpdate(encodeAwarenessUpdate(awareness, clients));
    };

    const handleAwarenessUpdate = (
      change: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      if (origin === remoteAwarenessOrigin) {
        return;
      }

      const changedClients = change.added.concat(change.updated, change.removed);
      sendUpdate(encodeAwarenessUpdate(awareness, changedClients));
    };

    const handleMessage = (event: MessageEvent) => {
      const update = toAwarenessUpdate(event.data);

      if (update === null) {
        return;
      }

      void Promise.resolve(update).then((resolvedUpdate) => {
        applyAwarenessUpdate(awareness, resolvedUpdate, remoteAwarenessOrigin);
      });
    };

    websocket.addEventListener("open", broadcastFullState);
    websocket.addEventListener("message", handleMessage);
    awareness.on("update", handleAwarenessUpdate);

    return () => {
      removeAwarenessStates(awareness, [awareness.clientID], "room awareness cleanup");
      awareness.off("update", handleAwarenessUpdate);
      websocket.removeEventListener("open", broadcastFullState);
      websocket.removeEventListener("message", handleMessage);
      websocket.close();
    };
  }, [awareness, isReady, roomId, sessionUserId]);

  return awareness;
}
