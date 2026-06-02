import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";

export const app = new Hono()
  .use(
    "/auth/*",
    cors({
      origin: env.appUrl,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .route("/", healthRoutes)
  .route("/", authRoutes);

export type ApiApp = typeof app;
