// src/components/AdBlockWall.jsx
import { ShieldAlertIcon, RefreshCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdBlockWall({ onRecheck, isChecking }) {
  const { t } = useTranslation();

  return (
    // ID INI WAJIB ADA, BIAR MUTATION OBSERVER BISA NGEDETEKSI KALAU INI DIHAPUS
    <div
      id="adblock-wall"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/20 text-red-500">
          <ShieldAlertIcon size={32} />
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">
          {t("adblock.title", "Adblock Terdeteksi!")}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          {t(
            "adblock.subtitle",
            "Renscraft gratis karena didukung oleh iklan. Tolong matikan Adblock (ekstensi browser atau DNS) untuk melanjutkan.",
          )}
        </p>

        <div className="mb-6 rounded-lg bg-zinc-950 p-4 text-left text-xs text-zinc-400">
          <p className="font-semibold text-zinc-200 mb-2">Cara mematikan:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Ekstensi:</strong> Klik ikon Adblock di kanan atas Chrome,
              pilih "Pause on this site".
            </li>
            <li>
              <strong>DNS/HP:</strong> Matikan Private DNS (AdGuard/NextDNS)
              atau ganti ke Google DNS (8.8.8.8).
            </li>
          </ul>
        </div>

        <button
          onClick={onRecheck}
          disabled={isChecking}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50">
          <RefreshCwIcon
            size={16}
            className={isChecking ? "animate-spin" : ""}
          />
          {isChecking
            ? t("common.loading", "Memeriksa...")
            : t("adblock.recheck", "Saya sudah matikan, cek lagi")}
        </button>
      </div>
    </div>
  );
}
