import { app as schemaApp } from "@rcode/schema";
import permissions from "@rcode/schema/permissions";
import { createJazzContext } from "jazz-tools/backend";
import { env } from "./env";

export const jazzContext = createJazzContext({
  appId: env.jazzAppId,
  app: schemaApp,
  permissions,
  driver: { type: "memory" },
  serverUrl: env.jazzServerUrl,
  env: process.env.NODE_ENV === "production" ? "prod" : "dev",
  userBranch: "main",
  backendSecret: env.backendSecret,
});

export function getBackendDb() {
  return jazzContext.asBackend(schemaApp);
}
