// src/hooks/useAdminNotifications.js
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function useAdminNotifications() {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    // Daftarin Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("[SW] Gagal daftar", err);
      });
    }

    const connectWS = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = import.meta.env.VITE_BASE_URL
        ? import.meta.env.VITE_BASE_URL.replace(/^https?:\/\//, "")
        : window.location.hostname === "renscraft.web.id"
          ? "api.renscraft.web.id"
          : "localhost:3000";

      const wsUrl = `${protocol}//${host}/api/admin/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          // Tampilkan Toast (kalo lagi buka web)
          toast.success(data.message, { icon: "🔔", duration: 8000 });

          // Tampilkan Push Notifikasi
          if (Notification.permission === "granted") {
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification(data.title, {
                body: data.message,
                icon: "/og-image.png", // GANTI KE PNG
                badge: "/og-image.png", // GANTI KE PNG
                vibrate: [200, 100, 200],
              });
            } else {
              new Notification(data.title, {
                body: data.message,
                icon: "/og-image.png",
              });
            }
          }
        } catch (err) {
          console.error("[WS] Gagal parse", err);
        }
      };

      ws.current.onclose = () => {
        // Simpan id timeout biar bisa di-clear pas unmount
        reconnectTimeout.current = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); // CLEAR TIMEOUT
    };
  }, []);
}
