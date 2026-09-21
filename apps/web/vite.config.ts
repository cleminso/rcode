import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { jazzPlugin } from "jazz-tools/dev/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number.parseInt(process.env.PORT ?? "5173", 10);
  const apiUrl = env.VITE_API_BASE_URL ?? "https://api.rcode.localhost:1355";

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tanstackRouter({
        target: "react",
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
        autoCodeSplitting: true,
      }),
      viteReact(),
      tailwindcss(),
      jazzPlugin({ schemaDir: "../../packages/database/schema/src", inspector: true, }),
    ],
    server: {
      port,
      host: true,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
      target: "es2022",
    },
  };
});
