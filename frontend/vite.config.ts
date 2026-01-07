import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7371,
    host: true, // Allow access from network (for iOS testing)
  },
  preview: {
    port: 7371,
  },
})
