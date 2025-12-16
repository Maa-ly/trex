import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './src/manifest.json',
      watchFilePaths: ['src/**/*'],
      additionalInputs: ['src/dashboard/index.html'],
    }),
  ],
  server: {
    open: '/src/dashboard/index.html',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
  },
});
