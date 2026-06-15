// API is node-side, not Vite-side. It needs a place to:
// - load apps/api/.env
// - validate required server env
// - provide safe local defaults for app/auth URLs
// - parse PORT

import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(url: URL) {
  if (existsSync(url) === false) return;

  const content = readFileSync(url, "utf8");

  for (const line of content.split("\n")) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#") === true) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(new URL("../.env", import.meta.url));

function readEnv(name: string) {
  const value = process.env[name];

  if (value !== undefined && value !== "") {
    return value;
  }

  throw new Error(`${name} is required.`);
}

function readOptionalEnv(name: string) {
  const value = process.env[name];

  if (value !== undefined && value !== "") {
    return value;
  }

  return undefined;
}

function readPort() {
  const value = readOptionalEnv("PORT") ?? "4000";
  const port = Number.parseInt(value, 10);

  if (Number.isNaN(port) === true) {
    throw new Error("PORT must be a number.");
  }

  return port;
}

function readOriginList(name: string) {
  return (readOptionalEnv(name) ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
}

const appUrl = readOptionalEnv("APP_URL") ?? readOptionalEnv("VITE_LOCAL_APP_URL") ?? "https://rcode.localhost";
const allowedOrigins = Array.from(
  new Set([
    appUrl,
    readOptionalEnv("VITE_APP_URL"),
    readOptionalEnv("VITE_LOCAL_APP_URL"),
    ...readOriginList("ALLOWED_ORIGINS"),
  ].filter((origin) => origin !== undefined)),
);

export const env = {
  port: readPort(),
  host: readOptionalEnv("HOST") ?? "127.0.0.1",
  appUrl,
  allowedOrigins,
  betterAuthUrl: readOptionalEnv("BETTER_AUTH_URL") ?? "https://api.rcode.localhost",
  betterAuthBasePath: readOptionalEnv("BETTER_AUTH_BASE_PATH") ?? "/auth",
  emailOtpWebhookUrl: readOptionalEnv("EMAIL_OTP_WEBHOOK_URL"),
  jazzAppId: readEnv("JAZZ_APP_ID"),
  jazzServerUrl: readEnv("JAZZ_SERVER_URL"),
  backendSecret: readEnv("BACKEND_SECRET"),
  betterAuthSecret: readEnv("BETTER_AUTH_SECRET"),
};
