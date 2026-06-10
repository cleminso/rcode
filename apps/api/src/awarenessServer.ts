import type { Socket } from "node:net";
import type { IncomingMessage } from "node:http";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as Y from "yjs";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { env } from "./env";

interface AwarenessClient {
  room: AwarenessRoom;
  roomId: string;
  socket: WebSocket;
}

interface AwarenessRoom {
  awareness: Awareness;
  clientOwners: Map<number, AwarenessClient>;
  clients: Set<AwarenessClient>;
  doc: Y.Doc;
}

interface AwarenessUpgradeServer {
  on(event: "upgrade", listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void): void;
  on(event: "close", listener: () => void): void;
}

const awarenessPath = "/api/awareness";

interface PresenceRoomSummary {
  roomId: string;
  userCount: number;
}

interface PresenceSubscriber {
  onSummary: (summary: PresenceSummary) => void;
  roomIds: Set<string>;
}

const presenceStore = new Map<string, PresenceRoomSummary>();
const presenceSubscribers = new Set<PresenceSubscriber>();

export interface PresenceSummary {
  rooms: PresenceRoomSummary[];
  timestamp: number;
}

export function getPresenceSummary(roomIds: readonly string[]): PresenceSummary {
  const rooms: PresenceRoomSummary[] = [];

  for (const roomId of roomIds) {
    const summary = presenceStore.get(roomId);

    if (summary !== undefined) {
      rooms.push(summary);
    }
  }

  return {
    rooms,
    timestamp: Date.now(),
  };
}

export function subscribePresenceSummary(
  roomIds: readonly string[],
  onSummary: (summary: PresenceSummary) => void,
) {
  const subscriber: PresenceSubscriber = {
    onSummary,
    roomIds: new Set(roomIds),
  };

  presenceSubscribers.add(subscriber);
  onSummary(getPresenceSummary(roomIds));

  return () => {
    presenceSubscribers.delete(subscriber);
  };
}

function arePresenceSummariesEqual(left: PresenceRoomSummary | undefined, right: PresenceRoomSummary | null) {
  if (left === undefined || right === null) {
    return left === undefined && right === null;
  }

  return left.roomId === right.roomId && left.userCount === right.userCount;
}

function notifyPresenceSubscribers(roomId: string) {
  for (const subscriber of presenceSubscribers) {
    if (subscriber.roomIds.has(roomId) === false) {
      continue;
    }

    subscriber.onSummary(getPresenceSummary(Array.from(subscriber.roomIds)));
  }
}

function setPresenceSummary(roomId: string, summary: PresenceRoomSummary | null) {
  const previousSummary = presenceStore.get(roomId);

  if (arePresenceSummariesEqual(previousSummary, summary) === true) {
    return;
  }

  if (summary === null) {
    presenceStore.delete(roomId);
  } else {
    presenceStore.set(roomId, summary);
  }

  notifyPresenceSubscribers(roomId);
}

function getSessionUserId(value: unknown) {
  if (typeof value !== "object" || value === null || "user" in value === false) {
    return null;
  }

  const user = value.user;

  if (typeof user !== "object" || user === null || "sessionUserId" in user === false) {
    return null;
  }

  return typeof user.sessionUserId === "string" ? user.sessionUserId : null;
}

function getRequestUrl(request: IncomingMessage) {
  if (request.url === undefined) {
    return null;
  }

  try {
    return new URL(request.url, env.appUrl);
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string | undefined) {
  if (origin === undefined) {
    return false;
  }

  return env.allowedOrigins.includes(origin);
}

function getRoomId(request: IncomingMessage) {
  const url = getRequestUrl(request);

  if (url === null || url.pathname !== awarenessPath) {
    return null;
  }

  const roomId = url.searchParams.get("room");

  if (roomId === null || roomId.trim() === "") {
    return null;
  }

  return roomId;
}

function toBinaryMessage(data: RawData) {
  if (data instanceof Buffer === true) {
    return data;
  }

  if (data instanceof ArrayBuffer === true) {
    return Buffer.from(data);
  }

  if (Array.isArray(data) === true) {
    return Buffer.concat(data);
  }

  return null;
}

export function attachAwarenessServer(server: AwarenessUpgradeServer) {
  const websocketServer = new WebSocketServer({ noServer: true });
  const rooms = new Map<string, AwarenessRoom>();

  const updatePresenceStore = (roomId: string, room: AwarenessRoom) => {
    const sessionUserIds = new Set<string>();

    for (const state of room.awareness.getStates().values()) {
      const sessionUserId = getSessionUserId(state);

      if (sessionUserId !== null) {
        sessionUserIds.add(sessionUserId);
      }
    }

    if (sessionUserIds.size === 0) {
      setPresenceSummary(roomId, null);
      return;
    }

    setPresenceSummary(roomId, {
      roomId,
      userCount: sessionUserIds.size,
    });
  };

  const getRoom = (roomId: string) => {
    const existingRoom = rooms.get(roomId);

    if (existingRoom !== undefined) {
      return existingRoom;
    }

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    awareness.setLocalState(null);

    const room: AwarenessRoom = {
      awareness,
      clientOwners: new Map(),
      clients: new Set(),
      doc,
    };

    // Listen to remote and local awareness changes and propagate awareness state to other clients.
    awareness.on("update", (change: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
      const changedClients = change.added.concat(change.updated, change.removed);

      if (changedClients.length === 0) {
        return;
      }

      if (isAwarenessClient(origin) === true) {
        for (const clientId of change.added.concat(change.updated)) {
          room.clientOwners.set(clientId, origin);
        }
      }

      for (const clientId of change.removed) {
        room.clientOwners.delete(clientId);
      }

      updatePresenceStore(roomId, room);

      const update = encodeAwarenessUpdate(awareness, changedClients);

      for (const client of room.clients) {
        if (origin === client || client.socket.readyState !== WebSocket.OPEN) {
          continue;
        }

        client.socket.send(update);
      }
    });

    rooms.set(roomId, room);
    return room;
  };

  const deleteRoomIfEmpty = (roomId: string, room: AwarenessRoom) => {
    if (room.clients.size !== 0) {
      return;
    }

    rooms.delete(roomId);
    setPresenceSummary(roomId, null);
    room.awareness.destroy();
    room.doc.destroy();
  };

  server.on("upgrade", (request, socket: Socket, head) => {
    const roomId = getRoomId(request);
    const origin = request.headers.origin;

    if (roomId === null || isAllowedOrigin(origin) === false) {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request, roomId);
    });
  });

  websocketServer.on("connection", (socket: WebSocket, _request: IncomingMessage, roomId: string) => {
    const room = getRoom(roomId);
    const client: AwarenessClient = { room, roomId, socket };
    const knownClientIds = Array.from(room.awareness.getStates().keys());

    if (knownClientIds.length > 0 && socket.readyState === WebSocket.OPEN) {
      socket.send(encodeAwarenessUpdate(room.awareness, knownClientIds));
    }

    room.clients.add(client);
    updatePresenceStore(roomId, room);

    socket.on("message", (data) => {
      const message = toBinaryMessage(data);

      if (message === null) {
        return;
      }

      try {
        applyAwarenessUpdate(room.awareness, message, client);
      } catch (error) {
        console.error("Invalid awareness update received.", { error, roomId });
        socket.close(1003, "Invalid awareness update");
        return;
      }

    });

    socket.on("close", () => {
      room.clients.delete(client);
      const ownedClientIds: number[] = [];

      for (const [clientId, owner] of room.clientOwners) {
        if (owner === client && room.awareness.getStates().has(clientId) === true) {
          ownedClientIds.push(clientId);
        }
      }

      if (ownedClientIds.length > 0) {
        removeAwarenessStates(room.awareness, ownedClientIds, client);
      }

      deleteRoomIfEmpty(roomId, room);
    });
  });

  server.on("close", () => {
    for (const room of rooms.values()) {
      room.awareness.destroy();
      room.doc.destroy();
    }

    rooms.clear();
    presenceStore.clear();
    presenceSubscribers.clear();
    websocketServer.close();
  });
}

function isAwarenessClient(value: unknown): value is AwarenessClient {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "socket" in value && "room" in value && "roomId" in value;
}
