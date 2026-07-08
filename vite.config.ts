import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the build works at any mount path (GitHub Pages serves
  // this project at /game-of-thrones-world/). The app is hash-routed, so
  // relative asset URLs are safe.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
