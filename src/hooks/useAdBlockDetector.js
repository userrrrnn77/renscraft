// src/hooks/useAdBlockDetector.js
import { useState, useEffect, useCallback } from "react";

export function useAdBlockDetector() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAdBlock = useCallback(async () => {
    setIsChecking(true);

    // 1. CEK COSMETIC (Ekstensi uBlock/AdBlock di Chrome)
    const bait = document.createElement("div");
    bait.className = "adsbox ad-placement doubleclick ad-banner text-ad";
    bait.style.cssText =
      "position:fixed;top:-10px;left:-10px;width:1px;height:1px;";
    document.body.appendChild(bait);

    // 2. CEK NETWORK (DNS/Pi-hole/AdGuard di HP atau WiFi)
    let networkBlocked = false;
    try {
      await fetch(
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        },
      );
    } catch (err) {
      networkBlocked = true;
    }

    // Tunggu setengah detik biar ekstensi sempet nyembunyiin bait element
    setTimeout(() => {
      const cosmeticBlocked =
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        window.getComputedStyle(bait).display === "none" ||
        window.getComputedStyle(bait).visibility === "hidden";

      // Kalau salah satu nge-block, kita anggap user pakai Adblock
      const currentlyBlocked = cosmeticBlocked || networkBlocked;

      setIsBlocked(currentlyBlocked);
      setIsChecking(false);
      bait.remove();

      // ==========================================
      // ANTI-HAPUS DOM (Mutation Observer)
      // ==========================================
      if (currentlyBlocked) {
        // Hapus observer lama kalau ada (biar gak dobel)
        if (window.__adblockObserver) {
          window.__adblockObserver.disconnect();
        }

        // Pasang "mata-mata" buat ngawasin kalau elemen kita dihapus
        const observer = new MutationObserver(() => {
          const wall = document.getElementById("adblock-wall");
          if (!wall) {
            // User ngehapus elemen lewat inspect? Paksa reload!
            window.location.reload();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        window.__adblockObserver = observer;
      }
    }, 600);
  }, []);

  useEffect(() => {
    checkAdBlock();

    // Cek ulang tiap 3 detik (jaga-jaga kalau user baru nyalain adblock)
    const interval = setInterval(checkAdBlock, 3000);

    return () => {
      clearInterval(interval);
      if (window.__adblockObserver) window.__adblockObserver.disconnect();
    };
  }, [checkAdBlock]);

  return { isBlocked, isChecking, recheck: checkAdBlock };
}
