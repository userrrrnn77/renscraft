import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import prerender from "vite-plugin-prerender-spa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    prerender({
      routes: ["/"],
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".trycloudflare.com"],
    cors: true,
    proxy: {
      "/api": "http://localhost:3000",
      "/auth/v1": {
        target: "https://kqzsuymhcusqdlkcznqh.supabase.co",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
