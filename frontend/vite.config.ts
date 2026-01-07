import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7371,
    proxy: {
      // Directs any call starting with /api to your Java server
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // If your Java API doesn't have /api in the actual URL, 
        // rewrite it: rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Directs Keycloak auth calls to your Keycloak server
      '/auth': {
        target: 'http://localhost:8180',
        changeOrigin: true,
      }
    },
    host: true, // Allow access from network (for iOS testing)
  },
  preview: {
    port: 7371,
  },
})
