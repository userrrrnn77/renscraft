// src/components/RewardAdModal.jsx
import { useState, useEffect } from "react";
import { CheckCircle2Icon, XIcon, PlayIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api/api";
import { useAppContext } from "../context/AppContext";

const SMARTLINK_URL = "https://araplhn.org/4/273d6901f5f9cf21fe65557a24dedb5b";
const WATCH_TIME_SECONDS = 30;

export default function RewardAdModal({ onClose }) {
  const { refreshCredits } = useAppContext();
  const [step, setStep] = useState("intro"); // intro -> watching -> claim -> success
  const [timeLeft, setTimeLeft] = useState(WATCH_TIME_SECONDS);
  const [sessionId, setSessionId] = useState(null);
  const [rewardAmount, setRewardAmount] = useState(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== "watching") return;

    let timer;

    const startTimer = () => {
      // Timer HANYA jalan kalau tab Renscraft disembunyiin (user lagi di tab iklan)
      if (!document.hidden) return;

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep("claim");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleVisibilityChange = () => {
      // Bersihin timer lama setiap kali ada perubahan status tab
      clearInterval(timer);

      if (document.hidden) {
        // User baru pindah ke tab iklan, atau lagi di tab iklan
        startTimer();
      } else {
        // User balik ke tab Renscraft, timer otomatis berhenti (pause)
        console.log("Timer paused: user is back on Renscraft.");
      }
    };

    // Panggil pertama kali (buat mastiin)
    handleVisibilityChange();

    // Pasang event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [step]);

  const handleStartWatch = async () => {
    setLoading(true);
    try {
      // 1. Minta tiket session ke Backend
      const { data } = await api.post("/api/ads/session");
      setSessionId(data.sessionId);
      setRewardAmount(data.credits);

      // 2. Buka Iklan (tab baru)
      window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");

      // 3. Mulai timer
      setTimeLeft(WATCH_TIME_SECONDS);
      setStep("watching");
    } catch (err) {
      toast.error(errorMessage(err, "Gagal memulai sesi iklan"));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      // Klaim ke backend
      const { data } = await api.post("/api/ads/claim", { sessionId });

      await refreshCredits();
      toast.success(`Berhasil dapat +${data.credits} kredit!`);
      setStep("success");
    } catch (err) {
      toast.error(errorMessage(err, "Gagal klaim kredit"));
      setStep("intro"); // Balikin ke awal kalau gagal (misal ketahuan nyontek)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs dark:bg-zinc-950/70">
      <div className="relative w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={onClose}
          disabled={step === "watching"}
          className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50">
          <XIcon size={16} />
        </button>

        <div className="mb-4 text-center">
          <h3 className="text-base font-semibold dark:text-zinc-50">
            Kredit Gratis
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tonton iklan sebentar, dapat kredit.
          </p>
        </div>

        {/* STEP 1: INTRO */}
        {step === "intro" && (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Dapatkan{" "}
                <strong className="text-lg">+{rewardAmount} Kredit</strong>{" "}
                hanya dengan menonton iklan selama {WATCH_TIME_SECONDS} detik.
              </p>
            </div>
            <button
              onClick={handleStartWatch}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950">
              {loading ? (
                <Loader2Icon size={16} className="animate-spin" />
              ) : (
                <PlayIcon size={16} />
              )}
              {loading ? "Memuat..." : "Tonton Sekarang"}
            </button>
          </div>
        )}

        {/* STEP 2: WATCHING (COUNTDOWN) */}
        {step === "watching" && (
          <div className="space-y-4 text-center">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-full border-4 border-zinc-100 dark:border-zinc-800">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {timeLeft}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Jangan tutup tab ini. Selesaikan iklan di tab baru.
            </p>
          </div>
        )}

        {/* STEP 3: CLAIM */}
        {step === "claim" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
              <CheckCircle2Icon size={32} />
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Waktu habis! Silakan klaim kreditmu.
            </p>
            <button
              onClick={handleClaim}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading && <Loader2Icon size={16} className="animate-spin" />}
              {loading ? "Memproses..." : `Klaim ${rewardAmount} Kredit`}
            </button>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <CheckCircle2Icon className="mx-auto text-emerald-500" size={40} />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Kredit berhasil ditambahkan!
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
