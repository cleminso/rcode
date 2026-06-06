import type { Socket } from "node:net";
import type { IncomingMessage } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { env } from "./env";

interface AwarenessClient {
  // Holds the last ephemeral Awareness update from this socket only while the
  // socket is connected, so late joiners can receive current live presence
  // without writing cursor state to Jazz.
  latestUpdate: Buffer | null;
  roomId: string;
  socket: WebSocket;
}

interface AwarenessUpgradeServer {
  on(event: "upgrade", listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void): void;
  on(event: "close", listener: () => void): void;
}

const awarenessPath = "/api/awareness";

function getRequestUrl(request: IncomingMessage) {
  const host = request.headers.host;

  if (host === undefined || request.url === undefined) {
    return null;
  }

  return new URL(request.url, `http://${host}`);
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
  const clients = new Set<AwarenessClient>();

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
    const client: AwarenessClient = { latestUpdate: null, roomId, socket };

    for (const peer of clients) {
      if (peer.roomId !== roomId || peer.latestUpdate === null || socket.readyState !== WebSocket.OPEN) {
        continue;
      }

      // Send current in-memory states from already-connected peers to the new
      // peer. Future updates are still broadcast peer-to-peer by room below.
      socket.send(peer.latestUpdate);
    }

    clients.add(client);

    socket.on("message", (data) => {
      const message = toBinaryMessage(data);

      if (message === null) {
        return;
      }

      client.latestUpdate = message;

      for (const peer of clients) {
        if (peer.roomId !== roomId || peer.socket === socket || peer.socket.readyState !== WebSocket.OPEN) {
          continue;
        }

        peer.socket.send(message);
      }
    });

    socket.on("close", () => {
      clients.delete(client);
    });
  });

  server.on("close", () => {
    websocketServer.close();
  });
}
