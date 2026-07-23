import tailwindcss from "@tailwindcss/vite";
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("monaco-editor")) {
            return "monaco";
          }
          if (id.includes("yjs") || id.includes("y-protocols") || id.includes("y-monaco")) {
            return "yjs";
          }
          if (id.includes("better-auth")) {
            return "better-auth";
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react";
          }
          if (id.includes("@tanstack/react-router")) {
            return "router";
          }
        },
      },
    },
  },
});
