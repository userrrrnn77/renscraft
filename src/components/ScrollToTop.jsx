// src/components/ScrollToTop.jsx
//
// React Router mengganti halaman tanpa reload, jadi posisi scroll tetap.
// Komponen ini "memaksa" scroll ke atas setiap kali user pindah halaman.
//
// - Dipasang di dalam <BrowserRouter> dan di luar <Routes> (App.jsx).
// - Skip kalau URL punya hash (#section) — biar anchor nav / deep-link tetap
//   berfungsi.
// - Behavior "auto" (instant), bukan "smooth": karena konten baru di-render
//   setelah navigasi, smooth scroll bakal keliatan "scroll halaman lama dulu".

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Anchor link (mis. /pricing#faq): jangan scroll, biar browser yang handle.
    if (hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
