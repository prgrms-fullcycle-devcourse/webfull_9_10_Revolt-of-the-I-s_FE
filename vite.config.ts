import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_BASE_URL

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/auth': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/users': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/teams': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/logs': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/documents': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/links': {
          target,
          changeOrigin: true,
          secure: true,
        },
        '/tasks': {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})