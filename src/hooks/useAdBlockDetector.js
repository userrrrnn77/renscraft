// src/hooks/useAdBlockDetector.js
import { useState, useEffect, useCallback } from "react";

export function useAdBlockDetector(isSafeRoute = false) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAdBlock = useCallback(async () => {
    setIsChecking(true);

    // 1. Cek Cosmetic (Ekstensi)
    const bait = document.createElement("div");
    bait.className = "adsbox ad-placement doubleclick ad-banner text-ad";
    bait.style.cssText =
      "position:fixed;top:-10px;left:-10px;width:1px;height:1px;";
    document.body.appendChild(bait);

    // 2. Cek Network (DNS)
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

    setTimeout(() => {
      const cosmeticBlocked =
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        window.getComputedStyle(bait).display === "none" ||
        window.getComputedStyle(bait).visibility === "hidden";

      const currentlyBlocked = cosmeticBlocked || networkBlocked;

      setIsBlocked(currentlyBlocked);
      setIsChecking(false);
      bait.remove();

      // ==========================================
      // ANTI-HAPUS DOM (Mutation Observer)
      // ==========================================
      if (currentlyBlocked) {
        // Bersihin observer lama
        if (window.__adblockObserver) {
          window.__adblockObserver.disconnect();
          window.__adblockObserver = null;
        }

        // JIKA DI HALAMAN AMAN (ADMIN/LOGIN), JANGAN PASANG OBSERVER!
        // Biar gak kena infinite reload loop.
        if (isSafeRoute) return;

        const observer = new MutationObserver(() => {
          const wall = document.getElementById("adblock-wall");
          if (!wall) {
            window.location.reload();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        window.__adblockObserver = observer;
      }
    }, 600);
  }, [isSafeRoute]);

  useEffect(() => {
    checkAdBlock();

    // Cek ulang tiap 3 detik
    const interval = setInterval(checkAdBlock, 3000);

    return () => {
      clearInterval(interval);
      if (window.__adblockObserver) window.__adblockObserver.disconnect();
    };
  }, [checkAdBlock]);

  return { isBlocked, isChecking, recheck: checkAdBlock };
}
