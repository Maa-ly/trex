import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { webExtension } from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './src/manifest.json',
      watchFilePaths: ['src/**/*'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: './src/popup/index.html',
        options: './src/options/index.html',
        dashboard: './src/dashboard/index.html',
        background: './src/background/index.ts',
        content: './src/content/index.ts',
      },
    },
  },
});

