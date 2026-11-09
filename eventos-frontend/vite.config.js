import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Móvil + navegadores modernos. Smart TV / wearables usan rutas o apps dedicadas.
  build: {
    target: ['es2020', 'chrome90', 'safari14', 'firefox90', 'edge90'],
    cssTarget: ['chrome90', 'safari14', 'firefox90', 'edge90'],
  },
  server: {
    host: true, // 0.0.0.0 — accesible en LAN y por túnel
    port: 5173,
    open: true,
    // Cloudflare quick tunnel: *.trycloudflare.com
    allowedHosts: true,
    proxy: {
      // 127.0.0.1 evita fallos IPv6 de "localhost" en Windows
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        timeout: 60_000,
        proxyTimeout: 60_000,
      },
    },
  },
})
