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
      // Kita coba fetch gambar kecil dari domain iklan umum (Google AdSense)
      // Kalau DNS-nya di-block, fetch ini bakal error/catch.
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
      setIsBlocked(cosmeticBlocked || networkBlocked);
      setIsChecking(false);
      bait.remove();
    }, 600);
  }, []);

  useEffect(() => {
    checkAdBlock();
  }, [checkAdBlock]);

  return { isBlocked, isChecking, recheck: checkAdBlock };
}
