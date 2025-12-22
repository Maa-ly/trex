import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { fileURLToPath } from "node:url";
// Removed custom SPA fallback; use Vite's built-in history fallback with root index.html

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: "./src/manifest.json",
      watchFilePaths: ["src/**/*"],
      additionalInputs: ["src/dashboard/index.html"],
    }),
  ],
  server: {
    open: "/",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        dashboard: fileURLToPath(
          new URL("./src/dashboard/index.html", import.meta.url)
        ),
      },
    },
  },
});
