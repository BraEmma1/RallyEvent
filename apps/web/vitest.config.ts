import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const shared = fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url));

// Separate from vite.config.ts so tests don't spin up the PWA service worker.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@rally/shared': shared },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/setupTests.ts'],
    css: false,
  },
});
