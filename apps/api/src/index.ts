import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

const server = serve(
  {
    fetch: app.fetch,
    hostname: env.host,
    port: env.port,
  },
  (info) => {
    console.log(`rcode API listening on http://${env.host}:${info.port}`);
  },
);

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close((error) => {
    if (error !== undefined) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
});
