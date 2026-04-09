import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/users': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/teams': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/logs': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/documents': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/links': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/tasks': {
        target: 'https://i-station.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})