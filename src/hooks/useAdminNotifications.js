import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function useAdminNotifications() {
  const ws = useRef(null);

  useEffect(() => {
    // Minta izin notifikasi browser (Cuma muncul sekali pas pertama buka)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Bikin koneksi WebSocket
    const connectWS = () => {
      // 1. Cari tau host backend
      let host;
      const baseUrl = import.meta.env.VITE_BASE_URL;

      if (baseUrl) {
        host = baseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      } else if (window.location.hostname === "ai.rensdev.my.id") {
        // KARENA VERCEL GAK BISA WEBSOCKET, KITA TEMBAK LANGSUNG KE API
        host = "api.rensdev.my.id";
      } else {
        // Fallback buat localhost (development)
        host = "localhost:3000";
      }

      const protocol = host.includes("localhost") ? "ws:" : "wss:";
      const wsUrl = `${protocol}//${host}/api/admin/ws`;

      console.log(`[WS] Mencoba konek ke: ${wsUrl}`); // Biar gampang debug

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => console.log("[WS] Admin terhubung!");

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 1. Tampilkan Toast (Kalau lagi buka web)
          toast.success(data.message, { icon: "🔔", duration: 8000 });

          // 2. Tampilkan Push Notification (Kalau HP di-lock / web di-minimize)
          if (Notification.permission === "granted") {
            new Notification(data.title, {
              body: data.message,
              icon: "/logo.svg",
              vibrate: [200, 100, 200], // Getar di HP
            });
          }
        } catch (err) {
          console.error("[WS] Gagal parse data", err);
        }
      };

      ws.current.onclose = () => {
        console.log("[WS] Terputus. Coba lagi dalam 5 detik...");
        setTimeout(connectWS, 5000); // Auto-reconnect
      };
    };

    connectWS();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);
}
