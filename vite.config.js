import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, // wajib biar bisa diakses cloudflared
    port: 5173,
    allowedHosts: [".trycloudflare.com"], // biar gak ganti2 tiap url random
    cors: true,
    proxy: {
      "/api": "http://localhost:3000"
   }
  },
  
})
