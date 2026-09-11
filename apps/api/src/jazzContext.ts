import { app as schemaApp } from "@rcode/schema";
import permissions from "@rcode/schema/permissions";
import { createJazzSession } from "jazz-tools/backend";
import { env } from "./env";

export const jazzSession = await createJazzSession({
  appId: env.jazzAppId,
  app: schemaApp,
  permissions,
  driver: { type: "memory" },
  serverUrl: env.jazzServerUrl,
  env: process.env.NODE_ENV === "production" ? "prod" : "dev",
  initial: { backendSecret: env.backendSecret },
});

export function getBackendDb() {
  const db = jazzSession.getSnapshot().client?.db;

  if (db === undefined) {
    throw new Error("Jazz backend session is not ready.");
  }

  return db;
}
