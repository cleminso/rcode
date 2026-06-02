import { Hono } from "hono";
import { auth } from "../auth";

export const authRoutes = new Hono();

authRoutes.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
