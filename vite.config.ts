import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites at /<repo-name>/.
// Set VITE_BASE in CI (e.g. "/plays/") so asset URLs resolve.
// Locally `vite dev` uses "/" by default.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
