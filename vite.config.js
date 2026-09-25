import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5199,
    strictPort: true,
  },
  build: {
    rollupOptions: { input: { invitation: 'index.html', admin: 'admin.html' } },
    outDir: 'dist',
    assetsInlineLimit: 8192,
  },
})
