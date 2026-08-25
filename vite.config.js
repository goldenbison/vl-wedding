import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5199,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192,
  },
})
