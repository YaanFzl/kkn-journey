import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      cssMinify: true,
    },
    server: {
      allowedHosts: ['sweet-monkeys-joke.loca.lt', '.loca.lt'],
    },
  },
});
