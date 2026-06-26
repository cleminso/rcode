import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { subscribePresenceSummary, type PresenceSummary } from "./awarenessServer";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { ogRoutes } from "./routes/og";

const MAX_PRESENCE_ROOMS = 100;

function getPresenceRoomIds(searchParams: URLSearchParams) {
  const uniqueRoomIds = new Set<string>();
  const rawRoomIds = searchParams.getAll("room");

  if (rawRoomIds.length > MAX_PRESENCE_ROOMS) {
    throw new Error(`Too many room IDs. Maximum allowed is ${MAX_PRESENCE_ROOMS}.`);
  }

  for (const roomId of rawRoomIds) {
    if (roomId.trim() !== "") {
      uniqueRoomIds.add(roomId);
    }
  }

  return Array.from(uniqueRoomIds);
}

function createPresenceStream(roomIds: readonly string[]) {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendSummary = (summary: PresenceSummary) => {
        try {
          controller.enqueue(encoder.encode(`event: presence\ndata: ${JSON.stringify(summary)}\n\n`));
        } catch {
          if (unsubscribe !== null) {
            unsubscribe();
            unsubscribe = null;
          }
        }
      };

      unsubscribe = subscribePresenceSummary(roomIds, sendSummary);
    },
    cancel() {
      if (unsubscribe !== null) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream",
    },
  });
}

export const app = new Hono()
  .use(
    "/auth/*",
    cors({
      origin: env.allowedOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .use(
    "/api/*",
    cors({
      origin: env.allowedOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "OPTIONS"],
    }),
  )
  .route("/", healthRoutes)
  .route("/", authRoutes)
  .route("/", ogRoutes)
  .get("/api/presence/stream", (c) => {
    let roomIds: string[];

    try {
      roomIds = getPresenceRoomIds(new URL(c.req.url).searchParams);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request.";
      return c.json({ error: message }, 400);
    }

    if (roomIds.length === 0) {
      return c.json({ error: "No room IDs provided." }, 400);
    }

    return createPresenceStream(roomIds);
  });

export type ApiApp = typeof app;
