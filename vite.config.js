import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiKey = env.API_PROXY_KEY

  if (mode === 'development' && !apiKey) {
    console.warn('API_PROXY_KEY is not set; GymBuddy requests will receive 401 responses.')
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
          headers: apiKey ? { 'X-API-Key': apiKey } : {},
        },
      },
    },
  }
})
