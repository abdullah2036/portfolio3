import { defineConfig } from 'vite';

export default defineConfig({
  // served from https://abdullah2036.github.io/portfolio3/
  base: '/portfolio3/',
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  server: { host: '127.0.0.1', port: 5174 },
});
