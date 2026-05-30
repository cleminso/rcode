import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { jazzPlugin } from "jazz-tools/dev/vite";


// Explicitly use PORT from portless
const PORT = parseInt(process.env.PORT || "5173");

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
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
    jazzPlugin({ schemaDir: "src/database" }),
  ],
  server: { port: PORT, host: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",

  },
});
