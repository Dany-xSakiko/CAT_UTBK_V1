import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: /api & /storage diteruskan ke Laravel (artisan serve :8000) supaya bebas CORS
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/storage': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
