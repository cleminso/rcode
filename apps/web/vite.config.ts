import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { jazzPlugin } from "jazz-tools/dev/vite";
import { defineConfig } from "vite";

const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const apiUrl = process.env.VITE_AUTH_BASE_URL ?? "https://api.rcode.localhost";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      autoCodeSplitting: false,
    }),
    viteReact(),
    tailwindcss(),
    jazzPlugin({ schemaDir: "../../packages/database/schema/src", server: false }),
  ],
  server: {
    port,
    host: true,
    proxy: {
      "/api": {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
});
