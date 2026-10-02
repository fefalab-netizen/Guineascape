import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets let the same build work on GitHub Pages project sites.
  base: './',
  server: {
    host: true,
  },
});
