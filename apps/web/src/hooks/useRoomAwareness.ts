import { useSession } from "jazz-tools/react";
import { useEffect, useMemo } from "react";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import type * as Y from "yjs";
import {
  assignOption,
  baseColors,
  type BaseColor,
  generateUniqueName,
} from "../lib/awareness";

interface UseRoomAwarenessArgs {
  displayName: string | null;
  isReady: boolean;
  roomId: string | null;
  ydoc: Y.Doc;
}

export interface AwarenessUser {
  clientId: number;
  color: BaseColor;
  displayName: string;
  picture?: string;
  sessionUserId: string;
}

export interface AwarenessState {
  user?: AwarenessUser;
}

const remoteAwarenessOrigin = { provider: "rcode-awareness-websocket" };
export const awarenessConnectionClosedOrigin = { provider: "rcode-awareness-websocket-closed" };

function getAwarenessSocketUrl(roomId: string) {
  // Awareness connects directly to the API host.
  const baseUrl = new URL(import.meta.env.VITE_AUTH_BASE_URL ?? window.location.origin);
  baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  baseUrl.pathname = "/api/awareness";
  baseUrl.search = "";
  baseUrl.searchParams.set("room", roomId);
  return baseUrl.toString();
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

function getUsedColors(awareness: Awareness) {
  const used: BaseColor[] = [];
  for (const state of awareness.getStates().values()) {
    const typedState = state as AwarenessState;
    if (typedState.user?.color !== undefined) {
      used.push(typedState.user.color);
    }
  }
  return used;
}

export function useRoomAwareness(args: UseRoomAwarenessArgs) {
  const { displayName: profileDisplayName, isReady, roomId, ydoc } = args;
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
    const currentState = awareness.getLocalState() ?? {};
    const existingUser = (currentState as AwarenessState).user;

    // Pick the least-used color from current awareness states
    const usedColors = getUsedColors(awareness);
    const color = existingUser?.color ?? assignOption([...baseColors], usedColors);

    const displayName = profileDisplayName ?? existingUser?.displayName ?? generateUniqueName();
    const picture = existingUser?.picture;

    awareness.setLocalState({
      ...currentState,
      user: {
        clientId: awareness.clientID,
        color,
        displayName,
        sessionUserId,
        ...(picture !== undefined ? { picture } : {}),
      } satisfies AwarenessUser,
    });
  }, [awareness, isReady, profileDisplayName, roomId, sessionUserId]);

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

      void Promise.resolve(update)
        .then((resolvedUpdate) => {
          applyAwarenessUpdate(awareness, resolvedUpdate, remoteAwarenessOrigin);
        })
        .catch(() => {
          websocket.close();
        });
    };

    const handleClose = () => {
      const remoteClients = Array.from(awareness.getStates().keys()).filter(
        (clientId) => clientId !== awareness.clientID,
      );

      if (remoteClients.length > 0) {
        removeAwarenessStates(awareness, remoteClients, awarenessConnectionClosedOrigin);
      }
    };

    const handlePageHide = () => {
      removeAwarenessStates(awareness, [awareness.clientID], "page unload");
    };

    websocket.addEventListener("open", broadcastFullState);
    websocket.addEventListener("message", handleMessage);
    websocket.addEventListener("close", handleClose);
    awareness.on("update", handleAwarenessUpdate);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      removeAwarenessStates(awareness, [awareness.clientID], "room awareness cleanup");
      awareness.off("update", handleAwarenessUpdate);
      websocket.removeEventListener("open", broadcastFullState);
      websocket.removeEventListener("message", handleMessage);
      websocket.removeEventListener("close", handleClose);
      window.removeEventListener("pagehide", handlePageHide);
      websocket.close();
    };
  }, [awareness, isReady, roomId, sessionUserId]);

  return awareness;
}
