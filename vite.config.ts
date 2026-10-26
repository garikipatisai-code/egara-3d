import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

// GitHub Pages project site. Change here if the repo or custom domain changes.
const base = '/egara-3d/';

export default defineConfig({
  base,
  server: { port: 8080 },
  preview: { port: 8080 },
  build: {
    target: 'es2022',
    minify: 'esbuild'
  }
});
