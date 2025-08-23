// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        // IMPORTANT: no rewrite — backend expects the /api prefix
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']   // workaround: skip problematic dep during optimize
  }
})
