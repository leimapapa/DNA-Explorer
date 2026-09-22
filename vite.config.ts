import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? './',
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [{ src: 'node_modules/webr/dist/*', dest: 'webr' }],
    }),
  ],
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
