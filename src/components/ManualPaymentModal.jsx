// src/components/ManualPaymentModal.jsx

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { errorMessage } from "../api/api";
import {
  createManualOrder,
  getManualConfig,
  getOrder,
  uploadProof,
} from "../api/manualPayment";
import { formatIdr } from "../utils/billing";

const MAX_FILE_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const POLL_MS = 4000;

const ManualPaymentModal = ({ onClose, initialPackageId = null }) => {
  const { t } = useTranslation();
  const { refreshCredits } = useAppContext();

  const [config, setConfig] = useState({ state: "loading" });
  const [order, setOrder] = useState(null);
  const [step, setStep] = useState("pick");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getManualConfig()
      .then((data) => !cancelled && setConfig({ state: "ready", data }))
      .catch((err) => {
        if (cancelled) return;
        setConfig({
          state: "error",
          message: errorMessage(err, t("manual.loadFailed")),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (autoStarted || !initialPackageId) return;
    if (config.state !== "ready") return;
    const pkg = config.data.packages.find((p) => p.id === initialPackageId);
    if (!pkg) return;
    setAutoStarted(true);
    startOrder(pkg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStarted, initialPackageId, config.state]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (step !== "waiting" || !order) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await getOrder(order.orderId);
        if (cancelled || !mountedRef.current) return;
        setStatus(fresh);
        if (fresh.status === "paid" && fresh.credited) {
          await refreshCredits();
          toast.success(t("buyCredits.creditsAdded", { count: fresh.credits }));
          setStep("done");
          return;
        }
        if (fresh.status === "manual_rejected") {
          toast.error(fresh.rejectReason || t("manual.orderRejected"));
          setStep("upload");
          return;
        }
        if (fresh.status === "expired") {
          toast.error(t("manual.orderExpired"));
          onClose();
          return;
        }
        setTimeout(tick, POLL_MS);
      } catch (err) {
        if (cancelled) return;
        console.error("polling", err);
        setTimeout(tick, POLL_MS * 2);
      }
    };
    const t = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, order, refreshCredits, onClose, t]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, onClose]);

  const startOrder = async (pkg) => {
    setBusy(true);
    try {
      const data = await createManualOrder(pkg.id);
      if (!mountedRef.current) return;
      setOrder(data);
      setStep("transfer");
    } catch (err) {
      toast.error(errorMessage(err, t("manual.couldNotCreate")));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const copyToClipboard = (text, messageKey) => {
    navigator.clipboard.writeText(text);
    toast.success(t(messageKey));
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(t("manual.fileTooLarge", { max: MAX_FILE_MB }));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(t("manual.needProof"));
    if (!name.trim()) return toast.error(t("manual.needName"));
    if (!bank.trim()) return toast.error(t("manual.needBank"));

    setBusy(true);
    try {
      await uploadProof(order.orderId, file, name.trim(), bank.trim());
      setStep("waiting");
    } catch (err) {
      toast.error(errorMessage(err, t("manual.uploadFailed")));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const goBack = () => {
    if (step === "transfer") {
      setOrder(null);
      setStep("pick");
    } else if (step === "upload") {
      setStep("transfer");
    }
  };

  const packages = config.state === "ready" ? config.data.packages : [];
  const bankInfo = config.state === "ready" ? config.data.bankInfo : "";
  const bankAccounts =
    config.state === "ready" ? config.data.bankAccounts || [] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs dark:bg-zinc-950/80"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy && step !== "waiting")
          onClose();
      }}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <button
          type="button"
          onClick={onClose}
          disabled={busy || step === "waiting"}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 cursor-pointer text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-50">
          <XIcon size={16} />
        </button>

        <div className="mb-5 pr-8">
          <h3 className="text-lg font-medium">{t("manual.title")}</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("manual.subtitle")}
          </p>
        </div>

        {config.state === "loading" && (
          <div className="flex justify-center py-12">
            <Loader2Icon className="animate-spin text-zinc-400" />
          </div>
        )}

        {config.state === "error" && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {config.message}
          </div>
        )}

        {config.state === "ready" && step === "pick" && (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => startOrder(pkg)}
                disabled={busy}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                <div>
                  <p className="text-sm font-medium">{pkg.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {pkg.credits} {t("payment.creditsSuffix")}
                  </p>
                </div>
                <p className="text-lg font-semibold">{formatIdr(pkg.amount)}</p>
              </button>
            ))}
          </div>
        )}

        {step === "transfer" && order && (
          <div className="space-y-5">
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-500/40 dark:bg-amber-500/5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                {t("manual.exactAmountLabel")}
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="font-mono text-3xl font-semibold text-amber-900 dark:text-amber-200">
                  {formatIdr(order.expectedAmount)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      String(order.expectedAmount),
                      "manual.copyAmount",
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300">
                  <CopyIcon size={11} />
                  {t("common.copy")}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                {t("manual.exactAmountNote", {
                  amount: formatIdr(order.amount),
                })}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {t("manual.recipientAccount")}
              </p>

              {bankAccounts.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {bankAccounts.map((acc, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
                      <div className="min-w-0 flex-1">
                        {acc.bank && (
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            {acc.bank}
                          </p>
                        )}
                        {acc.number ? (
                          <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {acc.number}
                          </p>
                        ) : (
                          <p className="mt-0.5 whitespace-pre-wrap font-mono text-sm text-zinc-900 dark:text-zinc-50">
                            {acc.raw}
                          </p>
                        )}
                        {acc.holder && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            a.n.{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {acc.holder}
                            </span>
                          </p>
                        )}
                      </div>

                      {acc.number && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(acc.number, "manual.copyAccount")
                          }
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
                          <CopyIcon size={10} />
                          {t("common.copy")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap font-mono text-sm text-zinc-900 dark:text-zinc-50">
                  {bankInfo || "—"}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <p>
                {t("manual.orderId")}:{" "}
                <code className="font-mono text-zinc-900 dark:text-zinc-100">
                  {order.orderId}
                </code>
              </p>
              <p className="mt-1">
                {t("manual.expiresAt")}:{" "}
                {new Date(order.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={goBack}
                disabled={busy}
                className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                {t("manual.changeP")}
              </button>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                {t("manual.uploadP")}
              </button>
            </div>
          </div>
        )}

        {step === "upload" && order && (
          <form onSubmit={submitProof} className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <div className="flex items-center justify-between gap-2">
                <span>{t("manual.transferAmount")}</span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      String(order.expectedAmount),
                      "manual.copyAmount",
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <CopyIcon size={10} />
                  {t("common.copy")}
                </button>
              </div>
              <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatIdr(order.expectedAmount)}
              </p>

              {bankAccounts.length > 0 && bankAccounts[0].number && (
                <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {bankAccounts[0].bank
                        ? `${bankAccounts[0].bank}`
                        : t("manual.recipientAccount")}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          bankAccounts[0].number,
                          "manual.copyAccount",
                        )
                      }
                      className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      <CopyIcon size={10} />
                      {t("common.copy")}
                    </button>
                  </div>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {bankAccounts[0].number}
                  </p>
                  {bankAccounts[0].holder && (
                    <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      a.n. {bankAccounts[0].holder}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {t("manual.senderName")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder={t("manual.senderNamePlaceholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {t("manual.senderBank")}
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
                maxLength={60}
                placeholder={t("manual.senderBankPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {t("manual.proof")}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 px-4 py-6 transition hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t("manual.proof")}
                    className="max-h-40 rounded"
                  />
                ) : (
                  <>
                    <UploadCloudIcon
                      size={22}
                      className="text-zinc-400 dark:text-zinc-500"
                    />
                    <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t("manual.clickToPick")}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                      {t("manual.proofAccept", { max: MAX_FILE_MB })}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-2 cursor-pointer text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                  {t("manual.changeImage")}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={goBack}
                disabled={busy}
                className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-50">
                {t("manual.back")}
              </button>
              <button
                type="submit"
                disabled={busy || !file}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                {busy && <Loader2Icon size={13} className="animate-spin" />}
                {busy ? t("manual.sending") : t("manual.sendProof")}
              </button>
            </div>
          </form>
        )}

        {step === "waiting" && (
          <div className="flex flex-col items-center py-6 text-center">
            <Loader2Icon
              size={32}
              className="animate-spin text-zinc-400 dark:text-zinc-500"
            />
            <p className="mt-4 text-sm font-medium">{t("manual.verifying")}</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              {t("manual.verifyingSub")}
            </p>

            <div className="mt-4 flex flex-col items-center gap-1.5">
              {status && (
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {t("manual.status")}: {status.status}
                </span>
              )}
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {t("manual.orderId")}:{" "}
                <code className="font-mono">{order.orderId}</code>
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const fresh = await getOrder(order.orderId);
                    setStatus(fresh);
                    if (fresh.status === "paid" && fresh.credited) {
                      await refreshCredits();
                      toast.success(
                        t("buyCredits.creditsAdded", { count: fresh.credits }),
                      );
                      setStep("done");
                    } else if (fresh.status === "manual_rejected") {
                      toast.error(fresh.rejectReason || t("manual.rejected"));
                      setStep("upload");
                    } else if (fresh.status === "expired") {
                      toast.error(t("manual.orderExpired"));
                      onClose();
                    } else {
                      toast(`${t("manual.status")}: ${fresh.status}`, {
                        icon: "ℹ️",
                      });
                    }
                  } catch (err) {
                    toast.error(t("manual.couldNotCheck"));
                  }
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                {t("manual.checkNow")}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-[10px] text-zinc-400 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300">
                {t("manual.closeModal")}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2Icon size={32} className="text-emerald-500" />
            <p className="mt-4 text-sm font-medium">
              {t("manual.creditsAdded")}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("manual.creditsAddedSub")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 cursor-pointer rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              {t("manual.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualPaymentModal;
