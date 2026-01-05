import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { fileURLToPath } from "node:url";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";

  return {
    plugins: [
      react(),
      ...(isExtension
        ? [
            webExtension({
              manifest: "./src/manifest.json",
              watchFilePaths: ["src/**/*"],
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      outDir: isExtension ? "dist-extension" : "dist",
      ...(isExtension
        ? {}
        : {
            rollupOptions: {
              input: {
                main: resolve(__dirname, "index.html"),
                dashboard: fileURLToPath(
                  new URL("./src/dashboard/index.html", import.meta.url)
                ),
              },
            },
          }),
    },
    server: {
      port: 5173,
      strictPort: true,
      open: false,
      hmr: {
        port: 5173,
      },
      // No CSP for dev server - allows all connections for CSPR.click SDK
      // Production should use proper CSP headers via server config
    },
  };
});
